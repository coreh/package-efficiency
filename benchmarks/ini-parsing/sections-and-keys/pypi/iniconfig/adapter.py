from iniconfig import IniConfig

def operation(text):
    return IniConfig("fixture.ini", data=text).sections
