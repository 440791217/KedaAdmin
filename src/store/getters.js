const getters = {
  sidebar: state => state.app.sidebar,
  size: state => state.app.size,
  device: state => state.app.device,
  visitedViews: state => state.tagsView.visitedViews,
  cachedViews: state => state.tagsView.cachedViews,
  token: state => state.user.token,
  avatar: state => state.user.avatar,
  name: state => state.user.user_name,
  user_name: state => state.user.user_name,
  user_id: state => state.user.user_id,
  gender: state => state.user.gender,
  roles: state => state.user.roles,
  access_token: state => state.user.access_token,
  refresh_token: state => state.user.refresh_token,
  permission_routes: state => state.permission.routes,
  addRoutes: state => state.permission.addRoutes,
  errorLogs: state => state.errorLog.logs
}
export default getters
