/* eslint-disable */
export default async () => {

  const t = {
    ['./common/dto/abstract.dto']: await import('./common/dto/abstract.dto'),
    ['./constants/language-code']: await import('./constants/language-code'),
    ['./modules/post/post.entity']: await import('./modules/post/post.entity'),
    ['./modules/post/dtos/post-translation.dto']: await import(
      './modules/post/dtos/post-translation.dto'
    ),
    ['./modules/user/user.entity']: await import('./modules/user/user.entity'),
    ['./modules/post/post-translation.entity']: await import(
      './modules/post/post-translation.entity'
    ),
    ['./modules/rbac/constants/roles.constant']: await import(
      './modules/rbac/constants/roles.constant'
    ),
    ['./modules/user/user-settings.entity']: await import(
      './modules/user/user-settings.entity'
    ),
    ['./constants/order']: await import('./constants/order'),
    ['./common/dto/page-meta.dto']: await import('./common/dto/page-meta.dto'),
    ['./modules/user/dtos/user.dto']: await import(
      './modules/user/dtos/user.dto'
    ),
    ['./modules/auth/dto/token-payload.dto']: await import(
      './modules/auth/dto/token-payload.dto'
    ),
    ['./common/dto/create-translation.dto']: await import(
      './common/dto/create-translation.dto'
    ),
    ['./modules/rbac/entities/role-permission.entity']: await import(
      './modules/rbac/entities/role-permission.entity'
    ),
    ['./modules/rbac/entities/role.entity']: await import(
      './modules/rbac/entities/role.entity'
    ),
    ['./modules/rbac/entities/permission.entity']: await import(
      './modules/rbac/entities/permission.entity'
    ),
    ['./modules/auth/dto/login-payload.dto']: await import(
      './modules/auth/dto/login-payload.dto'
    ),
    ['./modules/post/dtos/post.dto']: await import(
      './modules/post/dtos/post.dto'
    ),
  };
  return {
    '@nestjs/swagger/plugin': {
      models: [
        [
          import('./modules/audit/audit-log.entity'),
          {
            AuditLogEntity: {
              id: { required: true, type: () => String },
              userId: { required: true, type: () => String, nullable: true },
              action: { required: true, type: () => String },
              entityType: { required: true, type: () => String },
              entityId: { required: true, type: () => String },
              oldValues: { required: true, type: () => Object, nullable: true },
              updatedValues: {
                required: true,
                type: () => Object,
                nullable: true,
              },
              ipAddress: { required: true, type: () => String, nullable: true },
              userAgent: { required: true, type: () => String, nullable: true },
              source: { required: true, type: () => String },
              status: { required: true, type: () => String },
              errorMessage: {
                required: true,
                type: () => String,
                nullable: true,
              },
              metadata: { required: true, type: () => Object, nullable: true },
              timestamp: { required: true, type: () => Date },
            },
          },
        ],
        [
          import('./common/dto/abstract.dto'),
          {
            AbstractDto: {
              id: { required: true, type: () => Object },
              createdAt: { required: true, type: () => Date },
              updatedAt: { required: true, type: () => Date },
              translations: {
                required: false,
                type: () => [
                  t['./common/dto/abstract.dto'].AbstractTranslationDto,
                ],
              },
            },
            AbstractTranslationDto: {},
          },
        ],
        [
          import('./common/abstract.entity'),
          {
            AbstractEntity: {
              id: { required: true, type: () => Object },
              createdAt: { required: true, type: () => Date },
              updatedAt: { required: true, type: () => Date },
              translations: { required: false },
            },
            AbstractTranslationEntity: {
              languageCode: {
                required: true,
                enum: t['./constants/language-code'].LanguageCode,
              },
            },
          },
        ],
        [
          import('./modules/post/post-translation.entity'),
          {
            PostTranslationEntity: {
              title: { required: true, type: () => String },
              description: { required: true, type: () => String },
              postId: { required: true, type: () => Object },
              post: {
                required: false,
                type: () => t['./modules/post/post.entity'].PostEntity,
              },
            },
          },
        ],
        [
          import('./modules/post/dtos/post-translation.dto'),
          {
            PostTranslationDto: {
              title: { required: false, type: () => String },
              description: { required: false, type: () => String },
              languageCode: {
                required: false,
                enum: t['./constants/language-code'].LanguageCode,
              },
            },
          },
        ],
        [
          import('./modules/post/dtos/post.dto'),
          {
            PostDto: {
              title: { required: false, type: () => String },
              description: { required: false, type: () => String },
              info: { required: true, type: () => String },
              translations: {
                required: false,
                type: () => [
                  t['./modules/post/dtos/post-translation.dto']
                    .PostTranslationDto,
                ],
              },
            },
          },
        ],
        [
          import('./modules/post/post.entity'),
          {
            PostEntity: {
              userId: { required: true, type: () => Object },
              user: {
                required: true,
                type: () => t['./modules/user/user.entity'].UserEntity,
              },
              translations: {
                required: false,
                type: () => [
                  t['./modules/post/post-translation.entity']
                    .PostTranslationEntity,
                ],
              },
            },
          },
        ],
        [
          import('./modules/user/dtos/user.dto'),
          {
            UserDto: {
              firstName: {
                required: false,
                type: () => String,
                nullable: true,
              },
              lastName: { required: false, type: () => String, nullable: true },
              username: { required: true, type: () => String },
              role: {
                required: false,
                enum: t['./modules/rbac/constants/roles.constant'].RoleType,
              },
              email: { required: false, type: () => String, nullable: true },
              avatar: { required: false, type: () => String, nullable: true },
              phone: { required: false, type: () => String, nullable: true },
              isActive: { required: false, type: () => Boolean },
            },
          },
        ],
        [
          import('./modules/user/user-settings.entity'),
          {
            UserSettingsEntity: {
              isEmailVerified: { required: false, type: () => Boolean },
              isPhoneVerified: { required: false, type: () => Boolean },
              userId: { required: false, type: () => String },
              user: {
                required: false,
                type: () => t['./modules/user/user.entity'].UserEntity,
              },
            },
          },
        ],
        [
          import('./modules/user/user.entity'),
          {
            UserEntity: {
              firstName: { required: true, type: () => String, nullable: true },
              lastName: { required: true, type: () => String, nullable: true },
              role: {
                required: true,
                enum: t['./modules/rbac/constants/roles.constant'].RoleType,
              },
              email: { required: true, type: () => String, nullable: true },
              password: { required: true, type: () => String, nullable: true },
              phone: { required: true, type: () => String, nullable: true },
              avatar: { required: true, type: () => String, nullable: true },
              fullName: { required: true, type: () => String },
              settings: {
                required: false,
                type: () =>
                  t['./modules/user/user-settings.entity'].UserSettingsEntity,
              },
              posts: {
                required: false,
                type: () => [t['./modules/post/post.entity'].PostEntity],
              },
            },
          },
        ],
        [
          import('./modules/user/dtos/create-settings.dto'),
          {
            CreateSettingsDto: {
              isEmailVerified: { required: false, type: () => Boolean },
              isPhoneVerified: { required: false, type: () => Boolean },
            },
          },
        ],
        [
          import('./common/dto/page-options.dto'),
          {
            PageOptionsDto: {
              order: { required: true, enum: t['./constants/order'].Order },
              page: { required: true, type: () => Number },
              take: { required: true, type: () => Number },
              q: { required: false, type: () => String },
            },
          },
        ],
        [
          import('./common/dto/page-meta.dto'),
          {
            PageMetaDto: {
              page: { required: true, type: () => Number },
              take: { required: true, type: () => Number },
              itemCount: { required: true, type: () => Number },
              pageCount: { required: true, type: () => Number },
              hasPreviousPage: { required: true, type: () => Boolean },
              hasNextPage: { required: true, type: () => Boolean },
            },
          },
        ],
        [
          import('./common/dto/page.dto'),
          {
            PageDto: {
              data: { required: true },
              meta: {
                required: true,
                type: () => t['./common/dto/page-meta.dto'].PageMetaDto,
              },
            },
          },
        ],
        [
          import('./modules/user/dtos/users-page-options.dto'),
          { UsersPageOptionsDto: {} },
        ],
        [
          import('./modules/auth/dto/user-register.dto'),
          {
            UserRegisterDto: {
              firstName: { required: true, type: () => String },
              lastName: { required: true, type: () => String },
              email: { required: true, type: () => String },
              password: { required: true, type: () => String },
              phone: { required: false, type: () => String },
            },
          },
        ],
        [
          import('./modules/auth/dto/token-payload.dto'),
          {
            TokenPayloadDto: {
              expiresIn: { required: true, type: () => Number },
              token: { required: true, type: () => String },
            },
          },
        ],
        [
          import('./modules/auth/dto/user-login.dto'),
          {
            UserLoginDto: {
              email: { required: true, type: () => String },
              password: { required: true, type: () => String },
            },
          },
        ],
        [
          import('./modules/auth/dto/login-payload.dto'),
          {
            LoginPayloadDto: {
              user: {
                required: true,
                type: () => t['./modules/user/dtos/user.dto'].UserDto,
              },
              accessToken: {
                required: true,
                type: () =>
                  t['./modules/auth/dto/token-payload.dto'].TokenPayloadDto,
              },
              refreshToken: {
                required: true,
                type: () =>
                  t['./modules/auth/dto/token-payload.dto'].TokenPayloadDto,
              },
            },
          },
        ],
        [
          import('./modules/auth/dto/refresh-token.dto'),
          {
            RefreshTokenDto: {
              refreshToken: { required: true, type: () => String },
            },
          },
        ],
        [
          import('./common/dto/create-translation.dto'),
          {
            CreateTranslationDto: {
              languageCode: {
                required: true,
                enum: t['./constants/language-code'].LanguageCode,
              },
              text: { required: true, type: () => String },
            },
          },
        ],
        [
          import('./modules/post/dtos/create-post.dto'),
          {
            CreatePostDto: {
              title: {
                required: true,
                type: () => [
                  t['./common/dto/create-translation.dto'].CreateTranslationDto,
                ],
              },
              description: {
                required: true,
                type: () => [
                  t['./common/dto/create-translation.dto'].CreateTranslationDto,
                ],
              },
            },
          },
        ],
        [
          import('./modules/post/dtos/post-page-options.dto'),
          { PostPageOptionsDto: {} },
        ],
        [import('./modules/post/dtos/update-post.dto'), { UpdatePostDto: {} }],
        [
          import('./modules/rbac/dtos/permission.dto'),
          {
            PermissionDto: {
              slug: { required: true, type: () => String },
              resource: { required: true, type: () => String },
              action: { required: true, type: () => String },
              description: {
                required: true,
                type: () => String,
                nullable: true,
              },
              requiresOwnership: { required: true, type: () => Boolean },
              isWildcard: { required: true, type: () => Boolean },
              isActive: { required: true, type: () => Boolean },
            },
          },
        ],
        [
          import('./modules/rbac/dtos/role.dto'),
          {
            RoleDto: {
              name: { required: true, type: () => String },
              displayName: { required: true, type: () => String },
              description: {
                required: true,
                type: () => String,
                nullable: true,
              },
              hierarchy: { required: true, type: () => Number },
              isActive: { required: true, type: () => Boolean },
            },
          },
        ],
        [
          import('./modules/rbac/entities/role.entity'),
          {
            RoleEntity: {
              name: { required: true, type: () => String },
              displayName: { required: true, type: () => String },
              description: {
                required: true,
                type: () => String,
                nullable: true,
              },
              hierarchy: { required: true, type: () => Number },
              isActive: { required: true, type: () => Boolean },
              rolePermissions: {
                required: true,
                type: () => [
                  t['./modules/rbac/entities/role-permission.entity']
                    .RolePermissionEntity,
                ],
              },
            },
          },
        ],
        [
          import('./modules/rbac/entities/role-permission.entity'),
          {
            RolePermissionEntity: {
              roleId: { required: true, type: () => Object },
              permissionId: { required: true, type: () => Object },
              role: {
                required: true,
                type: () => t['./modules/rbac/entities/role.entity'].RoleEntity,
              },
              permission: {
                required: true,
                type: () =>
                  t['./modules/rbac/entities/permission.entity']
                    .PermissionEntity,
              },
            },
          },
        ],
        [
          import('./modules/rbac/entities/permission.entity'),
          {
            PermissionEntity: {
              slug: { required: true, type: () => String },
              resource: { required: true, type: () => String },
              action: { required: true, type: () => String },
              description: {
                required: true,
                type: () => String,
                nullable: true,
              },
              requiresOwnership: { required: true, type: () => Boolean },
              isWildcard: { required: true, type: () => Boolean },
              isActive: { required: true, type: () => Boolean },
              rolePermissions: {
                required: true,
                type: () => [
                  t['./modules/rbac/entities/role-permission.entity']
                    .RolePermissionEntity,
                ],
              },
            },
          },
        ],
      ],
      controllers: [
        [
          import('./modules/user/user.controller'),
          {
            UserController: {
              admin: {},
              getUsers: {},
              getUser: { type: t['./modules/user/dtos/user.dto'].UserDto },
            },
          },
        ],
        [
          import('./modules/auth/auth.controller'),
          {
            AuthController: {
              userLogin: {
                type: t['./modules/auth/dto/login-payload.dto'].LoginPayloadDto,
              },
              refreshToken: {
                type: t['./modules/auth/dto/token-payload.dto'].TokenPayloadDto,
              },
              userRegister: { type: t['./modules/user/dtos/user.dto'].UserDto },
              getCurrentUser: {
                type: t['./modules/user/dtos/user.dto'].UserDto,
              },
            },
          },
        ],
        [
          import('./modules/health-checker/health-checker.controller'),
          { HealthCheckerController: { check: { type: Object } } },
        ],
        [
          import('./modules/post/post.controller'),
          {
            PostController: {
              createPost: { type: t['./modules/post/dtos/post.dto'].PostDto },
              getPosts: {},
              getSinglePost: {
                type: t['./modules/post/dtos/post.dto'].PostDto,
              },
              updatePost: {},
              deletePost: {},
            },
          },
        ],
      ],
    },
  };
};

    const t = {
        ["./common/dto/abstract.dto"]: await import("./common/dto/abstract.dto"),
        ["./constants/language-code"]: await import("./constants/language-code"),
        ["./modules/post/post.entity"]: await import("./modules/post/post.entity"),        
["./modules/post/dtos/post-translation.dto"]: await import("./modules/post/dtos/post-translation.dto"),
        ["./modules/user/user.entity"]: await import("./modules/user/user.entity"),
        ["./modules/post/post-translation.entity"]: await import("./modules/post/post-translation.entity"),
        ["./modules/rbac/constants/roles.constant"]: await import("./modules/rbac/constants/roles.constant"),
        ["./modules/user/user-settings.entity"]: await import("./modules/user/user-settings.entity"),
        ["./constants/order"]: await import("./constants/order"),
        ["./common/dto/page-meta.dto"]: await import("./common/dto/page-meta.dto"),
        ["./modules/user/dtos/user.dto"]: await import("./modules/user/dtos/user.dto"),
        ["./modules/auth/dto/token-payload.dto"]: await import("./modules/auth/dto/token-payload.dto"),
        ["./common/dto/create-translation.dto"]: await import("./common/dto/create-translation.dto"),
        ["./modules/rbac/entities/role-permission.entity"]: await import("./modules/rbac/entities/role-permission.entity"),
        ["./modules/rbac/entities/role.entity"]: await import("./modules/rbac/entities/role.entity"),
        ["./modules/rbac/entities/permission.entity"]: await import("./modules/rbac/entities/permission.entity"),
        ["./modules/auth/dto/login-payload.dto"]: await import("./modules/auth/dto/login-payload.dto"),
        ["./modules/post/dtos/post.dto"]: await import("./modules/post/dtos/post.dto")
    };
    return { "@nestjs/swagger/plugin": { "models": [[import("./modules/audit/audit-log.entity"), { "AuditLogEntity": { id: { required: true, type: () => String }, userId: { required: true, type: () => String, nullable: true }, action: { required: true, type: () => String }, entityType: { required: true, type: () => String }, entityId: { required: true, type: () => String }, oldValues: { required: true, type: () => Object, nullable: true }, updatedValues: { required: true, type: () => Object, nullable: true }, ipAddress: { required: true, type: () => String, nullable: true }, userAgent: { required: true, type: () => String, nullable: true }, source: { required: true, type: () => String }, status: { required: true, type: () => String }, errorMessage: { required: true, type: () => String, nullable: true }, metadata: { required: true, type: () => Object, nullable: true }, timestamp: { required: true, type: () => Date } } }], [import("./common/dto/abstract.dto"), { "AbstractDto": { id: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, translations: { required: false, type: () => [t["./common/dto/abstract.dto"].AbstractTranslationDto] } }, "AbstractTranslationDto": {} }], [import("./common/abstract.entity"), { "AbstractEntity": { id: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, translations: { required: false } }, "AbstractTranslationEntity": { languageCode: { required: true, enum: t["./constants/language-code"].LanguageCode } } }], [import("./modules/post/post-translation.entity"), { "PostTranslationEntity": { title: { required: true, type: () => String }, description: { required: true, type: () => String }, postId: { required: true, type: () => Object }, post: { required: false, type: () => t["./modules/post/post.entity"].PostEntity } } }], [import("./modules/post/dtos/post-translation.dto"), { "PostTranslationDto": { title: { required: false, type: () => String }, description: { required: false, type: () => String }, languageCode: { required: false, enum: t["./constants/language-code"].LanguageCode } } }], [import("./modules/post/dtos/post.dto"), { "PostDto": { title: { required: false, type: () => String }, description: { required: false, type: () => String }, info: { required: true, type: () => String }, translations: { required: false, type: () => [t["./modules/post/dtos/post-translation.dto"].PostTranslationDto] } } }], [import("./modules/post/post.entity"), { "PostEntity": { userId: { required: true, type: () => Object }, user: { required: true, type: () => t["./modules/user/user.entity"].UserEntity }, translations: { required: false, type: () => [t["./modules/post/post-translation.entity"].PostTranslationEntity] } } }], [import("./modules/user/dtos/user.dto"), { "UserDto": { firstName: { required: false, type: () => String, nullable: true }, lastName: { required: false, type: () => String, nullable: true }, username: { required: true, type: () => String }, role: { required: false, enum: t["./modules/rbac/constants/roles.constant"].RoleType }, email: { required: false, type: () => String, nullable: true }, avatar: { required: false, type: () => String, nullable: true }, phone: { required: false, type: () => String, nullable: true }, isActive: { required: false, type: () => Boolean } } }], [import("./modules/user/user-settings.entity"), { "UserSettingsEntity": { isEmailVerified: { required: false, type: () => Boolean }, isPhoneVerified: { required: false, type: () => Boolean }, userId: { required: false, type: () => String }, user: { required: false, type: () => t["./modules/user/user.entity"].UserEntity } } }], [import("./modules/user/user.entity"), { "UserEntity": { firstName: { required: true, type: () => String, nullable: true }, lastName: { required: true, type: () => String, nullable: true }, role: { required: true, enum: t["./modules/rbac/constants/roles.constant"].RoleType }, email: { required: true, type: () => String, nullable: true }, password: { required: true, type: () => String, nullable: true }, phone: { required: true, type: () => String, nullable: true }, avatar: { required: true, type: () => String, nullable: true }, fullName: { required: true, type: () => String }, settings: { required: false, type: () => t["./modules/user/user-settings.entity"].UserSettingsEntity }, posts: { required: false, type: () => [t["./modules/post/post.entity"].PostEntity] } } }], [import("./modules/user/dtos/create-settings.dto"), { "CreateSettingsDto": { isEmailVerified: { required: false, type: () => Boolean }, isPhoneVerified: { required: false, type: () => Boolean } } }], [import("./common/dto/page-options.dto"), { "PageOptionsDto": { order: { required: true, enum: t["./constants/order"].Order }, page: { required: true, type: () => Number }, take: { required: true, type: () => Number }, q: { required: false, type: () => String } } }], [import("./common/dto/page-meta.dto"), { "PageMetaDto": { page: { required: true, type: () => Number }, take: { required: true, type: () => Number }, itemCount: { required: true, type: () => Number }, pageCount: { required: true, type: () => Number }, hasPreviousPage: { required: true, type: () => Boolean }, hasNextPage: { required: true, type: () => Boolean } } }], [import("./common/dto/page.dto"), { "PageDto": { data: { required: true }, meta: { required: true, type: () => t["./common/dto/page-meta.dto"].PageMetaDto } } }], [import("./modules/user/dtos/users-page-options.dto"), { "UsersPageOptionsDto": {} }], [import("./modules/auth/dto/user-register.dto"), { "UserRegisterDto": { firstName: { required: true, type: () => String }, lastName: { required: true, type: () => String }, email: { required: true, type: () => String }, password: { required: true, type: () => String }, phone: { required: false, type: () => String } } }], [import("./modules/auth/dto/token-payload.dto"), { "TokenPayloadDto": { expiresIn: { required: true, type: () => Number }, token: { required: true, type: () => String } } }], [import("./modules/auth/dto/user-login.dto"), { "UserLoginDto": { email: { required: true, type: () => String }, password: { required: true, type: () => String } } }], [import("./modules/auth/dto/login-payload.dto"), { "LoginPayloadDto": { user: { required: true, type: () => t["./modules/user/dtos/user.dto"].UserDto }, accessToken: { required: true, type: () => t["./modules/auth/dto/token-payload.dto"].TokenPayloadDto }, refreshToken: { required: true, type: () => t["./modules/auth/dto/token-payload.dto"].TokenPayloadDto } } }], [import("./modules/auth/dto/refresh-token.dto"), { "RefreshTokenDto": { refreshToken: { required: true, type: () => String } } }], [import("./common/dto/create-translation.dto"), { "CreateTranslationDto": { languageCode: { required: true, enum: t["./constants/language-code"].LanguageCode }, text: { required: true, type: () => String } } }], [import("./modules/post/dtos/create-post.dto"), { "CreatePostDto": { title: { required: true, type: () => [t["./common/dto/create-translation.dto"].CreateTranslationDto] }, description: { required: true, type: () => [t["./common/dto/create-translation.dto"].CreateTranslationDto] } } }], [import("./modules/post/dtos/post-page-options.dto"), { "PostPageOptionsDto": {} }], [import("./modules/post/dtos/update-post.dto"), { "UpdatePostDto": {} }], [import("./modules/rbac/dtos/permission.dto"), { "PermissionDto": { slug: { required: true, type: () => String }, resource: { required: true, type: () => String }, action: { required: true, type: () => String }, description: { required: true, type: () => String, nullable: true }, requiresOwnership: { required: true, type: () => Boolean }, isWildcard: { required: true, type: () => Boolean }, isActive: { required: true, type: () => Boolean } } }], [import("./modules/rbac/dtos/role.dto"), { "RoleDto": { name: { required: true, type: () => String }, displayName: { required: true, type: () => String }, description: { required: true, type: () => String, nullable: true }, hierarchy: { required: true, type: () => Number }, isActive: { required: true, type: () => Boolean } } }], [import("./modules/rbac/entities/role.entity"), { "RoleEntity": { name: { required: true, type: () => String }, displayName: { required: true, type: () => String }, description: { required: true, type: () => String, nullable: true }, hierarchy: { required: true, type: () => Number }, isActive: { required: true, type: () => Boolean }, rolePermissions: { required: true, type: () => [t["./modules/rbac/entities/role-permission.entity"].RolePermissionEntity] } } }], [import("./modules/rbac/entities/role-permission.entity"), { "RolePermissionEntity": { roleId: { required: true, type: () => Object }, permissionId: { required: true, type: () => Object }, role: { required: true, type: () => t["./modules/rbac/entities/role.entity"].RoleEntity }, permission: { required: true, type: () => t["./modules/rbac/entities/permission.entity"].PermissionEntity } } }], [import("./modules/rbac/entities/permission.entity"), { "PermissionEntity": { slug: { required: true, type: () => String }, resource: { required: true, type: () => String }, action: { required: true, type: () => String }, description: { required: true, type: () => String, nullable: true }, requiresOwnership: { required: true, type: () => Boolean }, isWildcard: { required: true, type: () => Boolean }, isActive: { required: true, type: () => Boolean }, rolePermissions: { required: true, type: () => [t["./modules/rbac/entities/role-permission.entity"].RolePermissionEntity] } } }], [import("./modules/auth/dto/create-user.dto"), { "CreateUserDto": { firstName: { required: true, type: () => String }, lastName: { required: true, type: () => String }, email: { required: true, type: () => String, format: "email" }, phone: { required: true, type: () => String }, roleType: { required: true, enum: t["./modules/rbac/constants/roles.constant"].RoleType } } }]], "controllers": [[import("./modules/user/user.controller"), { "UserController": { "admin": {}, "getUsers": {}, "getUser": { type: t["./modules/user/dtos/user.dto"].UserDto }, "createUser": {} } }], [import("./modules/auth/auth.controller"), { "AuthController": { "userLogin": { type: t["./modules/auth/dto/login-payload.dto"].LoginPayloadDto }, "refreshToken": { type: t["./modules/auth/dto/token-payload.dto"].TokenPayloadDto }, "userRegister": { type: t["./modules/user/dtos/user.dto"].UserDto }, "getCurrentUser": { type: t["./modules/user/dtos/user.dto"].UserDto } } }], [import("./modules/health-checker/health-checker.controller"), { "HealthCheckerController": { "check": { type: Object } } }], [import("./modules/post/post.controller"), { "PostController": { "createPost": { type: t["./modules/post/dtos/post.dto"].PostDto }, "getPosts": {}, "getSinglePost": { type: t["./modules/post/dtos/post.dto"].PostDto }, "updatePost": {}, "deletePost": {} } }]] } };
};

