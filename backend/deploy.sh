gcloud functions deploy calculate_sky_brightness --region australia-southeast2 --runtime python312 --trigger-http --allow-unauthenticated --source=.
# region=australia-southeast2
# runtime=python312
# gcloud functions deploy calculate_sky_brightness --gen2 --region={region} --runtime={runtime} --trigger-http --allow-unauthenticated