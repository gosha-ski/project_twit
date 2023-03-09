import {App} from "./app"
import {PostsController} from "./posts/posts_controller"
import {AuthenticationController} from "./authentication/authentication_controller"
import {GroupsController} from "./groups/groups_controller"
import {UsersController} from "./users/users_controller"

const app = new App([
	new PostsController(),
	new AuthenticationController(),
	new GroupsController(),
	new UsersController()
	], 5000)

app.listen()