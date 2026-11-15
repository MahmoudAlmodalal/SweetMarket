"""
Custom response renderers for apps.common.
"""

from djangorestframework_camel_case.render import CamelCaseJSONRenderer


class UnifiedCamelCaseJSONRenderer(CamelCaseJSONRenderer):
    """
    Custom JSON renderer that converts dictionary keys to camelCase
    and transparently wraps successful (2xx) responses into standard envelope:
    {
        "success": True,
        "data": ...,
        "meta": ...
    }

    Avoids double-wrapping if the payload is already enveloped or non-2xx.
    """

    def render(self, data, accepted_media_type=None, renderer_context=None):
        response = renderer_context.get('response') if renderer_context else None
        status_code = getattr(response, 'status_code', 200)

        # Only wrap 2xx success responses (excluding 204 No Content)
        if 200 <= status_code < 300:
            if status_code == 204:
                return super().render(data, accepted_media_type, renderer_context)

            if isinstance(data, dict):
                if 'success' in data:
                    wrapped_data = data
                elif 'results' in data and 'meta' in data:
                    wrapped_data = {
                        'success': True,
                        'data': data['results'],
                        'meta': data['meta'],
                    }
                elif 'data' in data and 'meta' in data:
                    wrapped_data = {
                        'success': True,
                        'data': data['data'],
                        'meta': data['meta'],
                    }
                else:
                    wrapped_data = {
                        'success': True,
                        'data': data,
                        'meta': None,
                    }
            else:
                wrapped_data = {
                    'success': True,
                    'data': data,
                    'meta': None,
                }
            return super().render(wrapped_data, accepted_media_type, renderer_context)

        return super().render(data, accepted_media_type, renderer_context)
