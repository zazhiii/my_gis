import axios from 'axios'
import { Message } from 'element-ui'

// 创建一个 axios 实例
const _axios = axios.create({
    baseURL: process.env.VUE_APP_BASE_API, // url = base url + request url
})


// 响应拦截器
_axios.interceptors.response.use(
    response => {
        const body = response.data
        if (body.code === 1) {
            return body
        } else {
            Message({
                message: body.msg || '请求失败',
                type: 'error',
                duration: 4 * 1000
            })
            return Promise.reject(new Error(body.msg || '请求失败'))
        }
    },
    error => {
        console.log('err' + error) // for debug
        Message({
            message: error.message,
            type: 'error',
            duration: 5 * 1000
        })
        return Promise.reject(error)
    }
)

export default _axios
