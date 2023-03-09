import * as express from "express"
import {authMiddleware} from "../middleware/auth_middleware"
import * as uniqid from "uniqid"
import {postgresClient} from "../postgre/postgresClient"
import {adminMiddleware} from "../middleware/admin_middleware"

class GroupsController{
	path = "/groups"
	router = express.Router()
	constructor(){
		this.initRoutes()
	}

	private initRoutes(){
		this.router.post(this.path, authMiddleware, this.createGroup)
		this.router.post(`${this.path}/:id`, authMiddleware, this.alterGroupById)
		this.router.get(this.path, authMiddleware, this.getAllGroups)
		this.router.get(`${this.path}/:id`, authMiddleware, this.getGroupById)
		this.router.get(`${this.path}/:id/suggestions`, authMiddleware, adminMiddleware, this.getGroupSuggestions)
	}

	private createGroup = async(request, response)=>{
		try{
			let user = request.user
			let group_data = request.body.group_data
			await this.createGroupService(user, group_data)
			response.send("group created")

		}catch(error){
			console.log(error)
		}
	}

	private createGroupService = async(user, group_data)=>{
		try{
			let group_id = uniqid()
			let group = await postgresClient.query(`INSERT INTO groups (id, name) VALUES ('${group_id}', '${group_data.name}');`)
			await postgresClient.query(`INSERT INTO group_members(user_id, group_id) VALUES ('${user.id}', '${group_id}');`)
			await postgresClient.query(`INSERT INTO group_admins(user_id, group_id) VALUES ('${user.id}', '${group_id}');`)
			await postgresClient.query(`INSERT INTO group_creators(user_id, group_id) VALUES ('${user.id}', '${group_id}');`)
		}catch(error){
			console.log(error)
		}
	}

	private getAllGroups = async(request, response)=>{
		try{
			//console.log("getAllGroups")
			let groups = (await postgresClient.query(`SELECT * FROM groups;`)).rows
			response.send(groups)
		}catch(error){
			console.log(error)
		}
	}

	private getGroupById = async(request, response)=>{
		try{
			let group_id = request.params.id
			let user = request.user
			let action = request.query.action
			if(action=="subscribe"){
				this.subscribeUserOnGroupService(user, group_id, response)
			}else{
			    let group = (await postgresClient.query(`SELECT * FROM groups WHERE id='${group_id}';`)).rows
			    response.send(group)
			}

		}catch(error){
			console.log(error)
		}
	}

	// private subscribeUserOnGroupService = async(user, group_id, response)=>{
	// 	try{
	// 		let userInGroup = (await postgresClient.query(
	// 			`SELECT * FROM group_members WHERE user_id='${user.id}' AND group_id='${group_id}';`
	// 			)).rows[0]
	// 		if(userInGroup){
	// 			response.send("already subscribed")
	// 		}else{
	// 			await postgresClient.query(
	// 				`INSERT INTO group_members (user_id, group_id) VALUES ('${user.id}','${group_id}');`
	// 				)
	// 			response.send("subscribed")
	// 		}
	// 	}catch(error){
	// 		console.log(error)
	// 	}
	// }

	private alterGroupById = async(request, response)=>{
		try{
			console.log(request.query)

		}catch(error){
			console.log(error)
		}
	}

	private getGroupSuggestions = async(request, response)=>{
		try{
			let group_id = request.params.id
			let suggestions = (await postgresClient.query(`SELECT * FROM group_suggestions WHERE group_id='${group_id}';`)).rows
			response.send(suggestions)

		}catch(error){
			console.log(error)
		}
	}

	private async consistUserInGroup(user, group_id){
		return new Promise(async function(resolve, reject){
			let userInGroup = (await postgresClient.query(`SELECT * FROM group_members WHERE user_id='${user.id}' AND group_id='${group_id}';`)).rows[0]
			if(userInGroup) resolve(true) //already consist
			else resolve(false) //dont consist
		})
	}

	private subscribeUserOnGroupService = async(user, group_id, response)=>{
		try{
			this.consistUserInGroup(user, group_id).then(
				async (result)=>{
					if(result) response.send("already subscribed on this group")
				    else{
						await postgresClient.query(`INSERT INTO group_members (user_id, group_id) VALUES ('${user.id}','${group_id}');`)	
						response.send("subscribed")
					}
				},
				error => console.log(error)
			)
		}catch(error){
			console.log(error)
		}
	}
}

export{GroupsController}