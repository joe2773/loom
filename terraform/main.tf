terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable Cloud Run API
resource "google_project_service" "run" {
  service            = "run.googleapis.com"
  disable_on_destroy = false
}

# Enable Artifact Registry API
resource "google_project_service" "artifactregistry" {
  service            = "artifactregistry.googleapis.com"
  disable_on_destroy = false
}

# Artifact Registry Docker repository
resource "google_artifact_registry_repository" "loom" {
  location      = var.region
  repository_id = var.service_name
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry]
}

# Cloud Run service
resource "google_cloud_run_service" "loom" {
  name     = var.service_name
  location = var.region

  template {
    spec {
      containers {
        image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}/${var.image_name}:latest"

        ports {
          container_port = 8080
        }

        resources {
          limits = {
            cpu    = "1000m"
            memory = "256Mi"
          }
        }
      }
    }
  }

  traffic {
    percent         = 100
    latest_revision = true
  }

  depends_on = [google_project_service.run]
}

# Allow unauthenticated public access
resource "google_cloud_run_service_iam_member" "public" {
  service  = google_cloud_run_service.loom.name
  location = google_cloud_run_service.loom.location
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# ── GCS Video Storage ─────────────────────────────────────────────────────────

# Enable GCS and IAM credentials APIs
resource "google_project_service" "storage" {
  service            = "storage.googleapis.com"
  disable_on_destroy = false
}

resource "google_project_service" "iamcredentials" {
  service            = "iamcredentials.googleapis.com"
  disable_on_destroy = false
}

# GCS bucket for video storage
resource "google_storage_bucket" "loom_videos" {
  name                        = "loom-videos-${var.project_id}"
  location                    = var.region
  uniform_bucket_level_access = true
  force_destroy               = false

  cors {
    origin          = ["*"]
    method          = ["GET", "PUT", "HEAD", "OPTIONS"]
    response_header = ["Content-Type", "Content-Range", "Accept-Ranges"]
    max_age_seconds = 3600
  }

  depends_on = [google_project_service.storage]
}

# Public read access for video playback
resource "google_storage_bucket_iam_member" "public_read" {
  bucket = google_storage_bucket.loom_videos.name
  role   = "roles/storage.objectViewer"
  member = "allUsers"
}

# ── API Backend ───────────────────────────────────────────────────────────────

# Dedicated service account for the API
resource "google_service_account" "loom_api" {
  account_id   = "loom-api"
  display_name = "Loom API Service Account"
}

# API SA can read/write objects in the bucket
resource "google_storage_bucket_iam_member" "api_object_admin" {
  bucket = google_storage_bucket.loom_videos.name
  role   = "roles/storage.objectAdmin"
  member = "serviceAccount:${google_service_account.loom_api.email}"
}

# API SA can sign URLs (self-referential — required for v4 signed URLs)
resource "google_service_account_iam_member" "api_token_creator" {
  service_account_id = google_service_account.loom_api.name
  role               = "roles/iam.serviceAccountTokenCreator"
  member             = "serviceAccount:${google_service_account.loom_api.email}"
}

# Artifact Registry repository for the API image
resource "google_artifact_registry_repository" "loom_api" {
  location      = var.region
  repository_id = "loom-api"
  format        = "DOCKER"

  depends_on = [google_project_service.artifactregistry]
}

# Cloud Run v2 service for the API backend lives in auth.tf (needs Cloud SQL
# + Secret Manager wiring, which uses cleaner v2 syntax).
