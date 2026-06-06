import React, { createContext, useContext, useReducer, useEffect,useRef} from "react";
import {io} from 'socket.io-client';
import api from'../utils/api';

const OScontext =createContext(null);

const initialState={

    //Auth
    user:null,
    token:localStorage.getItem('stackos_token'),
    isAuthenticated:false,
    //desktop
    windows:[],
    focusedWindowId:null,
    zCounter:100,

    //system

    notification:[],
    settings:{ theme:'dark', accent_color:'#0078d4', wallpaper:'cosmic', blur_effects:1, animations:1},
    installedApps:[],

    //UI state

    startMenuOpen:false,
    notifpanelOpen:false,
    calenderOpen:false,
    systemMetrics:{cpu:25},

};


function reducer(state,action){
    switch (action.type){

        case'SET_USER':
        return{...state,user:action.user, isAuthenticated:true};
        case'LOGOUT':
        return {...initialState, token:null,isAuthenticated:false};

 //windows---------------------------
 case'OPEN_WINDOWS':{
    const exists=state.windows.find(w=>w.id===action.win.id);
    if(exists)return reducer(state,{ type:'FOCUS_WINDOW', id:action.win.id});
    const z=state.zCounter + 1;
    return [... state.windows, { ...action.win, zIndex:z}]};
 }
 case 'CLOSE_WINDOW':
    return{... state, window:state.windows.filter(w=>w.id!==action.id),

        focusedWindowId:state.focusedWindowId===action.id? null:state.focusedWindowId
    };
case 'FOCUS_WINDOW':{
    const z =state.zCounter + 1;
    return{...state,zCounter:z, focusedWindowId:action.id,
        windows:state.windows.map(w=>w.id===action.id?{...w,zIndex:z, minimized:fasle}:w)
    };
}



    }

