output "service_url" {
  description = "Public HTTPS URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.loom.status[0].url
}

output "artifact_registry_repo" {
  description = "Artifact Registry repository URL (use as the image prefix for docker push)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}"
}

output "api_service_url" {
  description = "Public HTTPS URL of the loom-api Cloud Run service"
  value       = google_cloud_run_service.loom_api.status[0].url
}

output "bucket_name" {
  description = "GCS bucket holding uploaded videos"
  value       = google_storage_bucket.loom_videos.name
}

output "db_instance_connection_name" {
  description = "Cloud SQL connection name (project:region:instance) — used by the Cloud SQL Auth Proxy for local debugging"
  value       = google_sql_database_instance.loom.connection_name
}
