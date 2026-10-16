import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class SeoResolveDto {
  /** Chemin à résoudre, sans domaine (ex. `/formations/gestion/ancien-slug`). */
  @IsString()
  @IsNotEmpty()
  @Matches(/^\/[^\s]*$/, { message: 'path must start with /' })
  path!: string
}
