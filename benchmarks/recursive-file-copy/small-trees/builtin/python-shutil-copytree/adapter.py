import shutil

def operation(input):
    shutil.copytree(input['from'], input['to'])
