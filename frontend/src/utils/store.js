import { configureStore } from "@reduxjs/toolkit"
import { cartApi } from "./cartApi"
import { paymentApi } from "./paymentApi"
import { orderApi } from "./orderApi"

export const store = configureStore({
  reducer: {
    [cartApi.reducerPath]: cartApi.reducer,
    [paymentApi.reducerPath]: paymentApi.reducer,
    [orderApi.reducerPath]: orderApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(cartApi.middleware, paymentApi.middleware, orderApi.middleware),
})