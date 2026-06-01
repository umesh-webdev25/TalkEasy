from fastapi import APIRouter
from controllers import file_controller

router = APIRouter(prefix="/agent/files", tags=["files"])

router.post("/upload")(file_controller.upload_file)
router.post("/{file_id}/analyze")(file_controller.analyze_file)
router.get("/all")(file_controller.get_user_files_endpoint)
