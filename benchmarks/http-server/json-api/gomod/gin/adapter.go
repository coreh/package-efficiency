package main
import("net/http";"strconv";"github.com/gin-gonic/gin")
func handler() http.Handler {
 gin.SetMode(gin.ReleaseMode)
 router:=gin.New()
 router.GET("/",func(c *gin.Context){c.String(200,"Hello, World!")})
 router.GET("/users/:id",func(c *gin.Context){id,_:=strconv.Atoi(c.Param("id"));c.JSON(200,gin.H{"id":id,"name":"User "+strconv.Itoa(id)})})
 router.POST("/echo",func(c *gin.Context){var body any;if err:=c.ShouldBindJSON(&body);err!=nil {c.AbortWithStatus(400);return};c.JSON(200,gin.H{"echo":body})})
 return router
}
