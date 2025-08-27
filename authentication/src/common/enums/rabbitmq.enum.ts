export enum MessageBusChannelsEnum {
  auth = 'async_events_auth_micro',
}

export enum RabbitMessagesEnum {
  BusinessPermissionAdded = 'business.event.permission.added',
  BusinessPermissionDeleted = 'business.event.permission.deleted',
  PayeverBusinessEmail = 'payever.event.business.email',
  OAuthClientRemoved = 'oauth.event.oauthclient.removed',
  SendEmail = 'payever.event.mailer.send',
  PropagateUserData = 'auth.event.propagate_user_data',
  AccessTokenIssued = 'auth.event.access_token_issued',
  OAuthAccessTokenIssued = 'auth.event.oauth-token.issued',
  RpcUserRegistered = 'auth.rpc.user.registered',

  ShopCustomerRegistered = 'auth.event.shop_customer.registered',
  GetUserData = 'auth.commands.get_user_data',
  AccountUpdated = 'users.event.user_account.updated',
  BusinessCreated = 'users.event.business.created',
  BusinessRemoved = 'users.event.business.removed',
  UserRemoved = 'users.event.user.removed',
  AccountCreated = 'users.event.user.created',
  UserUpdated = 'users.event.user.updated',
  UserExportConsumer = 'users.event.user.export',
  BusinessEnabledAdded = 'users.event.business.enabled',

  AssignBusinessTag = 'auth.commands.assign_partner_tag',
  RemoveBusinessTag = 'auth.commands.remove_partner_tag',

  UserExport = 'auth.event.users.export',
  ExportNonInternalBusinesses = 'auth.event.non.internal.business.export',

  EmployeeCreated = 'users.event.employee.created',
  RpcEmployeeCreated = 'users.rpc.employee.created',
  EmployeeCreatedCustomAccess = 'users.event.employee.created.custom.access',
  EmployeeUpdated = 'users.event.employee.updated',
  EmployeeUpdatedCustomAccess = 'users.event.employee.updated.custom.access',
  EmployeeExported = 'users.event.employee.exported',
  EmployeeNamesSynchronized = 'users.event.employee.names.synchronized',
  EmployeeRemoved = 'users.event.employee.removed',

  EmployeeInviteUpdate = 'users.event.employee.invite-update',
  EmployeeResendInvite = 'users.event.employee.resend-invite',
  EmployeeRemovedSynced = 'auth.event.employee.removed.synced',
  EmployeeAddedSynced = 'auth.event.employee.added.synced',

  EmployeeRegister = 'auth.event.employee.register',
  EmployeeVerify = 'users.event.employee.verify',
  EmployeeInvite = 'users.event.employee.invite',
  EmployeeConfirm = 'users.event.employee.confirm',
  EmployeeConfirmInBusiness = 'users.event.employee.confirm-in-business',
  EmployeeMigrate = 'users.event.employee.migrate',

  EmployeeSyncHistory = 'users.event.employee.sync-history',

  TrustedDomainGroupCreated = 'auth.event.group.trusted-domain-created',
  GroupCreated = 'users.event.group.created',
  GroupUpdated = 'users.event.group.updated',
  GroupRemoved = 'users.event.group.removed',
  GroupAddEmployee = 'users.event.group.add-employee',
  GroupRemovedEmployee = 'users.event.group.remove-employee',

  OrganizationCreated = 'auth.event.organization.created',
  OrganizationUpdated = 'auth.event.organization.updated',

  RpcGetClients = 'auth.rpc.oauth.clients',
  RpcCreateClient = 'auth.rpc.oauth.create-client',
}
