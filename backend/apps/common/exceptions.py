"""
Domain business exceptions for Candy Loz.
"""

from rest_framework import status


class BusinessLogicError(Exception):
    """
    Domain exception raised when a business rule or state machine transition is violated.
    """

    def __init__(
        self,
        message: str,
        code: str = "BUSINESS_LOGIC_ERROR",
        details: list = None,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.details = details if details is not None else []
        self.status_code = status_code
