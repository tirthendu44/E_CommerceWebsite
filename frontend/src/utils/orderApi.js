import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_BACKEND_URL}/orders`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token")
      if (token) headers.set("Authorization", `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ["Order"],
  endpoints: (builder) => ({
    getOrders: builder.query({
      query: () => "/",
      transformResponse: (response) => response.orders || [],
      providesTags: ["Order"],
    }),
    getOrderById: builder.query({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: "Order", id }],
    }),
  }),
})

export const { useGetOrdersQuery, useGetOrderByIdQuery } = orderApi