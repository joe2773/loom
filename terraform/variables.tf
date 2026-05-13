variable "project_id" {
  description = "GCP project ID to deploy into"
  type        = string
}

variable "region" {
  description = "GCP region for Cloud Run and Artifact Registry"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Name used for the Cloud Run service and Artifact Registry repository"
  type        = string
  default     = "loom"
}

variable "image_name" {
  description = "Docker image name within the Artifact Registry repository"
  type        = string
  default     = "loom"
}

variable "google_oauth_client_id" {
  description = "Google OAuth 2.0 Web client ID used by the SPA to obtain ID tokens and by the API to verify them"
  type        = string
}

variable "db_tier" {
  description = "Cloud SQL machine tier for the Postgres instance"
  type        = string
  default     = "db-f1-micro"
}
