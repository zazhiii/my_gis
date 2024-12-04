import axios from "../utils/request";


export const getDistrict = () => {
    return axios.get('/district');
}

export const getWaters = () => {
    return axios.get('/waters');
}

export const getRoad = () => {
    return axios.get('/road');
}

export const getGreenBelt = () => {
    return axios.get('/greenbelt');
}

export const getGreenBeltRS = () => {
    return axios.get('/greenbelt_rs');
}

export const getIntersection = () => {
    return axios.get('/intersection');
}


export const getBuilding = () => {
    return axios.get('/building');
}

export const getIntersectionArea = () => {
    return axios.get('/intersection_area');
}

export const getGreenbeltArea = () => {
    return axios.get('/greenbelt_area');
}

export const getGreenbeltRSArea = () => {
    return axios.get('/greenbelt_rs_area');
}

