import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react"

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:5000/cart",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token")
      if (token) headers.set("Authorization", `Bearer ${token}`)
      return headers
    },
  }),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    getCart: builder.query({
      query: () => "/",
      transformResponse: (response) => response.products || [],
      transformErrorResponse: (response) => {
        if (response.status === 401) {
          localStorage.removeItem("token")
          window.location.href = "/login"
        }
        return response
      },
      providesTags: ["Cart"],
    }),
    incrementQuantity: builder.mutation({
      query: (id) => ({
        url: `/${id}/increment`,
        method: "PATCH",
      }),
      invalidatesTags: ["Cart"],
    }),
    decrementQuantity: builder.mutation({
      query: (id) => ({
        url: `/${id}/decrement`,
        method: "PATCH",
      }),
      invalidatesTags: ["Cart"],
    }),
    removeProduct: builder.mutation({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
    addToCart: builder.mutation({
      query: (item) => ({
        url: "/add",
        method: "POST",
        body: item, // { productId, name, price, quantity, image }
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
})

export const {
  useGetCartQuery,
  useIncrementQuantityMutation,
  useDecrementQuantityMutation,
  useRemoveProductMutation,
  useAddToCartMutation,
} = cartApi