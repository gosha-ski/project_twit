import * as express from "express"
import {postgresClient} from "../postgre/postgresClient"
import {authMiddleware} from "../middleware/auth_middleware"
import * as uniqid from "uniqid"
import {adminMiddleware} from "../middleware/admin_middleware"

class PostsController{
	path = "posts"
	router = express.Router()

	constructor(){
		this.initRoutes()
	}

	private initRoutes(){
		this.router.get(`/groups/:group_id/${this.path}`, authMiddleware, this.initActionWithPosts)
		this.router.get(`/groups/:group_id/${this.path}/:post_id`, authMiddleware, this.getPostById)
		this.router.patch(`/groups/:id/posts/:post_id`, authMiddleware, adminMiddleware, this.patchPostById)
	}

    //админ отклоняет или допускает предложенный пост до публикации
	private patchPostById = async(request, response)=>{
		try{
			let post_id = request.params.post_id
			let status = request.query.status
			await postgresClient.query(`UPDATE posts SET post_status='${status}' WHERE id='${post_id}';`)
			await postgresClient.query(`DELETE FROM group_suggestions WHERE post_id='${post_id}';`)
			response.send("updated")

		}catch(error){
			console.log(error)
		}
	}

	private getPostById = async(request, response)=>{
		try{

		}catch(error){
			console.log(error)
		}
	}

	private initActionWithPosts = async(request, response)=>{
		try{
			if(request.query.action=="suggest"){
				this.suggestPost(request, response)
			}else{
				this.getAllPosts(request, response)
			}
		}catch(error){
			console.log(error)
		}
	}

	private getAllPosts = async(request, response)=>{
		try{
			let group_id = request.params.group_id
			let posts = (await postgresClient.query(`SELECT * FROM posts WHERE group_id='${group_id}' AND post_status='approved';`)).rows
		    response.send(posts)

		}catch(error){
			console.log(error)
		}
	}

    
    //позволяет пользлвателям, состоящим в группе, предлагать новые посты
	private suggestPost = async(request, response)=>{
		try{
			let postData = request.body.postData
			let user = request.user
			let post_id = uniqid()
			let group_id = request.params.group_id

			let res = (await postgresClient.query(
				`SELECT * FROM group_members WHERE user_id='${user.id}' AND group_id='${group_id}';`)).rows[0]
			if(res){
				await this.suggestPostService(user, postData, post_id, group_id)
				response.send("suggested")

			}else{
				response.send("you dont consist in group")
			}
		}catch(error){
			console.log(error)
		}
	}

	private suggestPostService = async(user, postData, post_id, group_id)=>{
		try{

			await postgresClient.query(`INSERT INTO posts (id, title, content, author_id, group_id)
				VALUES ('${post_id}', '${postData.title}', '${postData.content}', '${user.id}', '${group_id}');`)

			await postgresClient.query(`INSERT INTO group_suggestions (post_id, group_id)
				VALUES ('${post_id}', '${group_id}');`)			

		}catch(error) {
			console.log(error)
		}
	}



}

export {PostsController}