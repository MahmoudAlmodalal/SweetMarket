"""
Standard pagination classes for Candy Loz.
"""

from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardPagination(PageNumberPagination):
    """
    Standard pagination class enforcing `page` and `limit` query parameters.

    Default limit is 20, ceiling is capped at 100.
    Produces structured response envelope with metadata:
    {
        "success": True,
        "data": [...],
        "meta": {
            "page": 1,
            "limit": 20,
            "total_items": 100,
            "total_pages": 5
        }
    }
    """

    page_query_param = 'page'
    page_size_query_param = 'limit'
    page_size = 20
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'success': True,
            'data': data,
            'meta': {
                'page': self.page.number,
                'limit': self.get_page_size(self.request),
                'total_items': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages,
            }
        })

    def get_paginated_response_schema(self, schema):
        return {
            'type': 'object',
            'properties': {
                'success': {'type': 'boolean', 'example': True},
                'data': schema,
                'meta': {
                    'type': 'object',
                    'properties': {
                        'page': {'type': 'integer', 'example': 1},
                        'limit': {'type': 'integer', 'example': 20},
                        'totalItems': {'type': 'integer', 'example': 100},
                        'totalPages': {'type': 'integer', 'example': 5},
                    },
                },
            },
        }
