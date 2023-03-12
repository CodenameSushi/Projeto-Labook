import { LikeOrDislikeDB, PostDB, PostWithCreatorDB, POST_LIKE } from "../types";
import { BaseDatabase } from "./BaseDatabase";

export class PostDatabase extends BaseDatabase {
    public static TABLE_POSTS = "posts"
    public static TABLE_LIKES_DISLIKES = "likes_dislikes"

    public getPostsWithCreators = async (): Promise<PostWithCreatorDB[]> => {
        const result: PostWithCreatorDB[] = await BaseDatabase
        .connection(PostDatabase.TABLE_POSTS)
        .select(
            "posts.id",
            "posts.creator_id",
            "posts.content",
            "posts.likes",
            "posts.dislikes",
            "posts.created_at",
            "posts.updated_at",
            "users.name AS creator_name"
        )
        .join("users","posts.creator_id", "=", "users.id")

        return result 
       
    }

    public insert = async (postDB: PostDB): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_POSTS).insert(postDB)
    }

    public findById = async (id: string): Promise<PostDB | undefined> => {
        const result: PostDB[] = await BaseDatabase
        .connection(PostDatabase.TABLE_POSTS)
        .select()
        .where({ id })

        return result[0]
    }

    public update = async (id: string, postDB: PostDB): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_POSTS).update(postDB).where({ id: id })
    }

    public delete = async (id: string): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_POSTS).delete().where({ id: id })
    }

    public findPostsWithCreatorById = async (postId: string): Promise<PostWithCreatorDB | undefined> => {
        const result: PostWithCreatorDB[] = await BaseDatabase
        .connection(PostDatabase.TABLE_POSTS)
        .select(
            "posts.id",
            "posts.creator_id",
            "posts.content",
            "posts.likes",
            "posts.dislikes",
            "posts.created_at",
            "posts.updated_at",
            "users.name AS creator_name"
        )
        .join("users","posts.creator_id", "=", "users.id")
        .where("posts.id", postId)

        return result[0]
       
    }

    public likeOrDislikePost = async (likeOrDislikeDB: LikeOrDislikeDB): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_LIKES_DISLIKES).insert(likeOrDislikeDB)
    }

    public findLikeOrDislike = async (likeOrDislikeDBToFind: LikeOrDislikeDB): Promise<POST_LIKE| null> => {
        const [ likeOrDislikeDB]: LikeOrDislikeDB[] = await BaseDatabase.connection(PostDatabase.TABLE_LIKES_DISLIKES).select().where({
            user_id: likeOrDislikeDBToFind.user_id,
            post_id: likeOrDislikeDBToFind.post_id
        })

        if(likeOrDislikeDB){
            return likeOrDislikeDB.like === 1 ? POST_LIKE.ALREADY_LIKED : POST_LIKE.ALREADY_DISLIKED
        } else {
            return null
        }
    }

    public removeLikeOrDislike = async (likeOrDislikeDB: LikeOrDislikeDB): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_LIKES_DISLIKES).delete().where({
            user_id: likeOrDislikeDB.user_id,
            post_id: likeOrDislikeDB.post_id
        })
    }

    public updateLikeOrDislike = async (likeOrDislikeDB: LikeOrDislikeDB): Promise<void> => {
        await BaseDatabase.connection(PostDatabase.TABLE_LIKES_DISLIKES).update(likeOrDislikeDB).where({
            user_id: likeOrDislikeDB.user_id,
            post_id: likeOrDislikeDB.post_id
        })
    }

    




}
