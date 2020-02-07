import axios from 'axios';
import { cacheAdapterEnhancer } from 'axios-extensions';
import * as constants from './constants';
import helpers from './helpers';
import tokenInterceptor from './tokenInterceptor';

const http = axios.create({
  baseURL: 'http://apiv2.kodilan.com/api',
  adapter: cacheAdapterEnhancer(axios.defaults.adapter),
});

http.interceptors.request.use(tokenInterceptor, err => Promise.reject(err));

export default {
  toggleLoading({ commit }) {
    commit(constants.TOGGLE_LOADING);
  },
  fetchRecentPosts({ state, commit }) {
    return http.get(`/posts?get=${constants.RECENT_POST_COUNT}&period=${state.activePeriod}`)
      .then((res) => {
        commit(constants.SET_RECENT_POSTS, res.data.data);

        return res.data;
      });
  },
  fetchFeaturedPosts({ commit }) {
    return http.get('/posts?get=3&is_featured=1')
      .then((res) => {
        commit(constants.SET_FEATURED, res.data.data);

        return res.data;
      });
  },
  fetchAllPosts({ commit }, payload = {}) {
    const page = payload
    && payload.page
    && Number.isInteger(payload.page)
    && payload.page > 1 ? payload.page : 1;

    return http.get(`/posts?get=${constants.PER_PAGE}&page=${page}`)
      .then((res) => {
        const { data } = res;
        commit(constants.SET_ALL_POSTS, data.data);
        commit(constants.SET_ALL_POST_META, {
          total: data.total,
          current_page: data.current_page,
          last_page: data.last_page,
        });

        return res.data;
      });
  },
  fetchBySlug(_, slug) {
    return http.get(`/posts/${slug}`)
      .then(res => res.data);
  },
  fetchByCompany(_, company) {
    return http.get(`/companies/${company}/posts`)
      .then(res => res.data);
  },
  fetchByTag(_, tag) {
    return http.get(`/tags/${tag}/posts`)
      .then(res => res.data);
  },
  search(_, params) {
    return http.get('/search', { params })
      .then(res => res.data);
  },
  fetchTags({ commit }) {
    return http.get('/tags')
      .then((res) => {
        commit(constants.SET_TAGS, res.data.data);
      });
  },
  fetchRelatedPosts({ dispatch }, post) {
    const postTags = post.tags.map(t => t.slug);
    const categoryTags = ['frontend', 'backend', 'mobile', 'designer', 'qa', 'devops'];
    const [mainTag] = postTags.filter(t => categoryTags.indexOf(t) > -1);

    if (!mainTag) {
      return Promise.resolve([]);
    }

    return dispatch('fetchByTag', mainTag)
      .then(res => helpers.rankPosts(post, postTags, res.data));
  },
  fetchAvailableLocations({ commit }) {
    return http.get('/posts/locations')
      .then((res) => {
        commit(constants.SET_AVAILABLE_LOCATIONS, res.data);
      });
  },
  fetchMe({ commit }) {
    return http.get('/user/me')
      .then(res => {
        commit('SET_ME', res.data)
      })
  },
  savePost(_, data) {
    return http.post('/posts', data);
  },
  subscribe(_, data) {
    return http.post('/newsletters', data);
  },
  setPeriod({ commit }, period) {
    commit('SET_ACTIVE_PERIOD', period);
  },
  signUp({ dispatch }, data) {
    return http.post('/register', data)
      .then((res) => {
        localStorage.setItem('AccessToken', res.data.access_token);
        dispatch('handleAuthCompleted');
        console.log(res);
      })
      .catch(error => console.log(error.response.data));
  },
  handleAuthCompleted({ commit }) {
    commit('setIsLoggedIn', true);
  },
  login({ dispatch }, data) {
    return http.post('/login', data)
      .then((res) => {
        localStorage.setItem('AccessToken', res.data.access_token);
        dispatch('handleAuthCompleted');
        console.log(res);
      })
      .catch(error => console.log(error.response.data));
  },
  createCompany(_, data) {
    return http.post('/companies?', data)
      .then((res) => {
        console.log(res);
      })
      .catch(error => console.log(error.response.data));
  },
  logout() {
    localStorage.removeItem('AccessToken');
    document.location = '/';
  },
};
