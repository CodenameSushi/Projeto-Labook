import { PostDatabase } from "../database/PostDatabase";
import { CreatePostInputDTO, DeletePostInputDTO, EditPostInputDTO, GetPostsInputDTO, GetPostsOutputDTO, LikeOrDislikePostInputDTO } from "../dtos/userDTO";
import { BadRequestError } from "../errors/BadRequestError";
import { NotFoundError } from "../errors/NotFoundError";
import { Post } from "../models/Post";
import { IdGenerator } from "../services/IdGenerator";
import { TokenManager } from "../services/TokenManager";
import { LikeOrDislikeDB, PostDB, PostWithCreatorDB, POST_LIKE, USER_ROLES } from "../types";

export class PostBusiness {
  constructor(
    private postDatabase: PostDatabase,
    private idGenerator: IdGenerator,
    private tokenManager: TokenManager
  ) {}

  public getPosts = async (input: GetPostsInputDTO): Promise<GetPostsOutputDTO> => {
    const { token } = input;

    if (!token) {
      throw new BadRequestError("token ausente");
    }

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("token inválido");
    }

    const postsWithCreatorDB: PostWithCreatorDB[] =
      await this.postDatabase.getPostsWithCreators();

    const posts = postsWithCreatorDB.map((postWithCreatorDB) => {
      const post = new Post(
        postWithCreatorDB.id,
        postWithCreatorDB.content,
        postWithCreatorDB.likes,
        postWithCreatorDB.dislikes,
        postWithCreatorDB.created_at,
        postWithCreatorDB.updated_at,
        postWithCreatorDB.creator_id,
        postWithCreatorDB.creator_name
      );

      return post.toBusinessModel();

    });

    const output: GetPostsOutputDTO = posts

    return output
  };

  public createPost = async (input: CreatePostInputDTO): Promise<void> => {
    const { token, content } = input

    if (!token) {
      throw new BadRequestError("token ausente");
    }

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("token inválido");
    }

    if (typeof content !== 'string') {
      throw new BadRequestError("'content' deve ser string")
    }

    const id = this.idGenerator.generate()

    const createdAt = new Date().toISOString()
    const updatedAt = new Date().toISOString()

    const creatorId = payload.id
    const creatorName = payload.name

    const post = new Post(
      id,
      content,
      0,
      0,
      createdAt,
      updatedAt,
      creatorId,
      creatorName
    )

    const postDB = post.toDBModel()

    await this.postDatabase.insert(postDB)

  }

  public editPost = async (input: EditPostInputDTO): Promise<void> => {
    const { idToEdit, token, content } = input

    if (!token) {
      throw new BadRequestError("token ausente");
    }

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("token inválido");
    }

    if (typeof content !== 'string') {
      throw new BadRequestError("'content' deve ser string")
    }

    const postDB: PostDB | undefined = await this.postDatabase.findById(idToEdit)

    if (!postDB) {
      throw new NotFoundError("'id' nao encontrado")
    }

    const creatorId = payload.id

    if (postDB.creator_id !== creatorId) {
      throw new BadRequestError("Somente o criador do post pode edita-lo")
    }

    const creatorName = payload.name

    const post = new Post(
      postDB.id,
      postDB.content,
      postDB.likes,
      postDB.dislikes,
      postDB.created_at,
      postDB.updated_at,
      creatorId,
      creatorName
    )

    post.setContent(content)
    post.setUpdatedAt(new Date().toISOString())

    const updatedPostDB = post.toDBModel()

    await this.postDatabase.update(idToEdit, updatedPostDB)

  }

  public deletePost = async(input: DeletePostInputDTO): Promise<void> => {
    const { idToDelete, token } = input

    if (!token) {
      throw new BadRequestError("token ausente");
    }

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("token inválido");
    }

    const postDB: PostDB | undefined = await this.postDatabase.findById(idToDelete)

    if (!postDB) {
      throw new NotFoundError("'id' nao encontrado")
    }

    if (
      payload.role !== USER_ROLES.ADMIN
      && postDB.creator_id !== payload.id) {
      throw new BadRequestError("Somente o criador do post ou ADMIN pode deleta-lo")
    }

    await this.postDatabase.delete(idToDelete)

  }

  public likeOrDislikePost = async (input: LikeOrDislikePostInputDTO): Promise<void> => {
    const { idToLikeOrDislike, token, like } = input

    if (!token) {
      throw new BadRequestError("token ausente");
    }

    const payload = this.tokenManager.getPayload(token);

    if (payload === null) {
      throw new BadRequestError("token inválido");
    }

    if (typeof like !== "boolean") {
      throw new BadRequestError("'like' deve ser boolean")
    }

    const postWithCreatorDB = await this.postDatabase.findPostsWithCreatorById(idToLikeOrDislike)

    if (!postWithCreatorDB) {
      throw new NotFoundError("'id' nao encontrado")
    }

    const userId = payload.id

    const likeDB = like ? 1 : 0 

    const likeOrDislikeDB: LikeOrDislikeDB = {
      user_id: userId,
      post_id: postWithCreatorDB.id,
      like: likeDB
    }

    const post = new Post(
      postWithCreatorDB.id,
      postWithCreatorDB.content,
      postWithCreatorDB.likes,
      postWithCreatorDB.dislikes,
      postWithCreatorDB.created_at,
      postWithCreatorDB.updated_at,
      postWithCreatorDB.creator_id,
      postWithCreatorDB.creator_name
    )

    const likeOrDislikeExists = await this.postDatabase.findLikeOrDislike(likeOrDislikeDB)

    if (likeOrDislikeExists === POST_LIKE.ALREADY_LIKED){

      if (like) {
        await this.postDatabase.removeLikeOrDislike(likeOrDislikeDB)
        post.removeLike()
      } else {
        await this.postDatabase.updateLikeOrDislike(likeOrDislikeDB)
        post.removeLike()
        post.addDislike()
      }

    } else if (likeOrDislikeExists === POST_LIKE.ALREADY_DISLIKED) {
      if (like) {
        await this.postDatabase.updateLikeOrDislike(likeOrDislikeDB)
        post.removeDislike()
        post.addLike()
      } else {
        await this.postDatabase.removeLikeOrDislike(likeOrDislikeDB)
        post.removeDislike()
      }


    } else {
      await this.postDatabase.likeOrDislikePost(likeOrDislikeDB)

      like ? post.addLike() : post.addDislike()
    }

    const updatedPost = post.toDBModel()

    await this.postDatabase.update(idToLikeOrDislike, updatedPost)

  }
}
