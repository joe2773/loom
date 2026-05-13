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

# The loom-api Cloud Run service stays on v1 — see main.tf. Cloud SQL is wired
# via the run.googleapis.com/cloudsql-instances annotation; secret env vars
# use value_from.secret_key_ref. Both are supported on v1.
