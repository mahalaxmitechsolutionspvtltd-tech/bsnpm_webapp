import { AdminLoginType, SanchalakLoginType } from "@/types/auth/loginTypes";
import axios from "axios";


const URI = process.env.NEXT_PUBLIC_API_BASE_URL

const adminLoginApi = async ({ adminId, password }: AdminLoginType) => {
  const payload = {
    adminId, password
  }



  const response = await axios.post(`${URI}/api/v1/admin/login`, payload, {
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true

  })

  return response;
}

const sanchalakLoginApi = async ({ sanchalakId, password }: SanchalakLoginType) => {
  const payload = {
    sanchalakId, password
  }

  const response = await axios.post(`${URI}/api/v1/sanchalak/login`, payload, {
    headers: {
      'Content-Type': 'application/json'
    },
    withCredentials: true
  })

  return response;

}

export { adminLoginApi, sanchalakLoginApi }