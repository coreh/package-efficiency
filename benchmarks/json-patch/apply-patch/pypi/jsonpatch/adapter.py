import json
import jsonpatch

def operation(value):
    try:
        patched = jsonpatch.apply_patch(json.loads(value['document']), value['patch'])
    except (jsonpatch.JsonPatchException, jsonpatch.JsonPointerException):
        return None
    return json.dumps(patched)
