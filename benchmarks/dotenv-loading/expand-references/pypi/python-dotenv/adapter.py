from io import StringIO
from dotenv import dotenv_values
def operation(text):
    return dotenv_values(stream=StringIO(text))
