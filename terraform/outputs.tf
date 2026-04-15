output "service_url" {
  description = "Public HTTPS URL of the deployed Cloud Run service"
  value       = google_cloud_run_service.loom.status[0].url
}

output "artifact_registry_repo" {
  description = "Artifact Registry repository URL (use as the image prefix for docker push)"
  value       = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}"
}
