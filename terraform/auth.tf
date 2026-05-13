# ── Auth-related infrastructure: Cloud SQL Postgres + Secret Manager ─────────

resource "google_project_service" "sqladmin" {
  service            = "sqladmin.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "secretmanager" {
  service            = "secretmanager.googleapis.com"
  disable_on_destroy = false
}

# Cloud SQL Postgres instance
resource "google_sql_database_instance" "loom" {
  name             = "loom-db"
  region           = var.region
  database_version = "POSTGRES_16"

  settings {
    tier              = var.db_tier
    availability_type = "ZONAL"

    backup_configuration {
      enabled = true
    }
  }

  deletion_protection = true
  depends_on          = [google_project_service.sqladmin]
}

resource "google_sql_database" "loom" {
  name     = "loom"
  instance = google_sql_database_instance.loom.name
}

resource "random_password" "db" {
  length  = 32
  special = false
}

resource "google_sql_user" "loom" {
  name     = "loom"
  instance = google_sql_database_instance.loom.name
  password = random_password.db.result
}

# JWT signing secret
resource "random_password" "jwt" {
  length  = 48
  special = false
}

resource "google_secret_manager_secret" "jwt_secret" {
  secret_id = "loom-jwt-secret"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "jwt_secret" {
  secret      = google_secret_manager_secret.jwt_secret.id
  secret_data = random_password.jwt.result
}

# DB password secret
resource "google_secret_manager_secret" "db_password" {
  secret_id = "loom-db-password"

  replication {
    auto {}
  }

  depends_on = [google_project_service.secretmanager]
}

resource "google_secret_manager_secret_version" "db_password" {
  secret      = google_secret_manager_secret.db_password.id
  secret_data = random_password.db.result
}

# Grant the loom-api service account access to both secrets
resource "google_secret_manager_secret_iam_member" "api_jwt_secret" {
  secret_id = google_secret_manager_secret.jwt_secret.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.loom_api.email}"
}

resource "google_secret_manager_secret_iam_member" "api_db_password" {
  secret_id = google_secret_manager_secret.db_password.id
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.loom_api.email}"
}

# Allow the API SA to connect to Cloud SQL
resource "google_project_iam_member" "api_cloudsql_client" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.loom_api.email}"
}

# ── Migrate loom-api to Cloud Run v2 (was v1 in main.tf) ─────────────────────
#
# The v1 google_cloud_run_service.loom_api defined in main.tf must be removed
# in the same plan as adding this v2 service; otherwise both will try to claim
# the name `loom-api`. See PR description for the `terraform state rm` /
# manual import dance if you need to preserve traffic during the cutover.

resource "google_cloud_run_v2_service" "loom_api" {
  name     = "loom-api"
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    service_account = google_service_account.loom_api.email

    volumes {
      name = "cloudsql"
      cloud_sql_instance {
        instances = [google_sql_database_instance.loom.connection_name]
      }
    }

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/loom-api/loom-api:latest"

      ports {
        container_port = 8080
      }

      volume_mounts {
        name       = "cloudsql"
        mount_path = "/cloudsql"
      }

      env {
        name  = "BUCKET_NAME"
        value = google_storage_bucket.loom_videos.name
      }
      env {
        name  = "ALLOWED_ORIGIN"
        value = google_cloud_run_service.loom.status[0].url
      }
      env {
        name  = "GOOGLE_CLIENT_ID"
        value = var.google_oauth_client_id
      }
      env {
        name  = "DB_USER"
        value = google_sql_user.loom.name
      }
      env {
        name  = "DB_NAME"
        value = google_sql_database.loom.name
      }
      env {
        name  = "DB_HOST"
        value = "/cloudsql/${google_sql_database_instance.loom.connection_name}"
      }
      env {
        name = "DB_PASSWORD"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.db_password.secret_id
            version = "latest"
          }
        }
      }
      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = google_secret_manager_secret.jwt_secret.secret_id
            version = "latest"
          }
        }
      }
      env {
        name  = "NODE_ENV"
        value = "production"
      }

      resources {
        limits = {
          cpu    = "1000m"
          memory = "256Mi"
        }
      }
    }
  }

  depends_on = [
    google_project_service.run,
    google_secret_manager_secret_iam_member.api_jwt_secret,
    google_secret_manager_secret_iam_member.api_db_password,
    google_project_iam_member.api_cloudsql_client,
  ]
}

# Public invoke on the v2 API service
resource "google_cloud_run_v2_service_iam_member" "api_public_v2" {
  name     = google_cloud_run_v2_service.loom_api.name
  location = google_cloud_run_v2_service.loom_api.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}
