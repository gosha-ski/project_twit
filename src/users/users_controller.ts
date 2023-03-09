import * as express from "express"
import {authMiddleware} from "../middleware/auth_middleware"
import {postgresClient} from "../postgre/postgresClient"

class UsersController{
	path="/users"
	router = express.Router()
	constructor(){
		this.initRoutes()
	}

	private initRoutes(){
		this.router.get(this.path, authMiddleware, this.getAllUsers)
		this.router.get(`${this.path}/:user_id`, authMiddleware, this.initActionWithUser)
		this.router.get(`${this.path}/:user_id/suggestions_to_friendship`, authMiddleware, this.getSuggestionsToFriendship)
	}

	private getAllUsers = async(request, response)=>{
		try{
			let users = (await postgresClient.query(`SELECT * FROM users;`)).rows
			response.send(users)

		}catch(error){

		}
	}

	private initActionWithUser = async(request, response)=>{
		try{
			let action = request.query.action
			console.log(action)
			if(action=="make_friends") this.makeUsersFriends(request, response)
			//else if(action == "block") this.blockUser(request, response)
			else this.getUserById(request, response)

		}catch(error){

		}
	}

	private getUserById = async(request, response)=>{
		try{
			//console.log("getUserById")
			let user_id=request.params.user_id
			let user = (await postgresClient.query(`SELECT id, name, email FROM users WHERE id='${user_id}';`)).rows[0]
			response.send(user)

		}catch(error){
			console.log(error)
		}
	}

	private makeUsersFriends = async(request, response)=>{
		try{
			let sender_id = request.user.id
			let reciever_id = request.params.user_id
			if(reciever_id!=sender_id){
				this.isUserAlreadyFriends(reciever_id, sender_id).then(
					(result) => {
						if(result.status == "already_friends") 
							response.send("you are already friends")
						else if(result.status == "not friends"){
							//this.makeUsersFriendsService(reciever_id, sender_id)
							this.sendSuggestionToFriendship(reciever_id, sender_id)
							response.send("suggestion to friendship was sent")
						}
					})
			}else response.send("you cannot add in friends yourself")
		}catch(error){
			console.log(error)
		}
	}

	private isUserAlreadyFriends = async(reciever_id, sender_id)=>{
		return new Promise(async (resolve, reject)=>{
			let set_one = (await postgresClient.query(`SELECT * FROM friends WHERE first_user='${reciever_id}' AND second_user='${sender_id}';`)).rows[0]
			let set_two = (await postgresClient.query(`SELECT * FROM friends WHERE first_user='${sender_id}' AND second_user='${reciever_id}';`)).rows[0]
			if(set_two || set_one){
				resolve({status: "already_friends"})
			}else{
				resolve({status: "not friends"})
			}
		})
	}

	private makeUsersFriendsService = async(reciever_id, sender_id)=>{
		try{
			await postgresClient.query(`INSERT INTO friends (first_user, second_user) VALUES ('${sender_id}', '${reciever_id}');`)

		}catch(error){
			console.log(error)
		}
	}

	private sendSuggestionToFriendship = async(reciever_id, sender_id)=>{
		try{
			await postgresClient.query(
				`INSERT INTO friends_suggestion ('sender_id', 'reciever_id') VALUES ('${sender_id}', '${reciever_id}');`
				)
		}catch(error){
			console.log(error)
		}

	}



}

export{UsersController}