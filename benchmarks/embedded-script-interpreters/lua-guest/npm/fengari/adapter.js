import fengari from 'fengari'

const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari

export const operation = (script) => {
  const L = lauxlib.luaL_newstate()
  lualib.luaL_openlibs(L)
  if (lauxlib.luaL_dostring(L, to_luastring(script)) !== 0) {
    throw new Error(to_jsstring(lua.lua_tostring(L, -1)))
  }
  const t = lua.lua_type(L, -1)
  if (t === lua.LUA_TNUMBER) return lua.lua_tonumber(L, -1)
  if (t === lua.LUA_TSTRING) return lua.lua_tojsstring(L, -1)
  throw new Error('unexpected result type')
}
