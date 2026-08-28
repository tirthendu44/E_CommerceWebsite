import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/payment",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token")
      if (token) headers.set("Authorization", `Bearer ${token}`)
      return headers
    },
  }),
  endpoints: (builder) => ({
    createOrder: builder.mutation({
      query: (amount) => ({
        url: "/create-order",
        method: "POST",
        body: { amount },
      }),
    }),
    verifyPayment: builder.mutation({
      query: (payload) => ({
        url: "/verify",
        method: "POST",
        body: payload,
      }),
    }),
  }),
})

export const { useCreateOrderMutation, useVerifyPaymentMutation } = paymentApi