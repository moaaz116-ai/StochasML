from typing import Any, Dict, Optional

class DomainException(Exception):
    def __init__(self, message: str, status_code: int = 400, details: Optional[Dict[str, Any]] = None):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

class NotFoundException(DomainException):
    def __init__(self, entity: str, entity_id: str):
        super().__init__(
            message=f"{entity} with id '{entity_id}' not found.",
            status_code=404,
            details={"entity": entity, "id": entity_id}
        )

class ValidationException(DomainException):
    def __init__(self, message: str, details: Optional[Dict[str, Any]] = None):
        super().__init__(message=message, status_code=422, details=details)
