import axios from 'axios';

const api=axios.create({ baseURL:'/api',withCredentials:true});

//attach JWT on every request

api.interceptors.request.use((cfg)=>{
    const token =localStorage.getItem('stackos_token');
    if(token) cfg.headers.Authorization=`Bearer ${token}`;
    return cfg;
});

//Global 401 handler

api.interceptors.response.use(
    (r)=> r,
    (err)=>{
        if(err.response?.status===401){
            localStorage.removeItem('stackos_token');
            window.location.href='/login';
        }
        return Promise.reject(err);
    }
);

export default api;