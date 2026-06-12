# React + Vite

此範本提供一個最小化的設定，可在 Vite 中啟用 React（含熱模組更新 HMR）以及部分 ESLint 規則，方便快速開發。

目前有兩個官方可用的插件：

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)（使用 Oxc）
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)（使用 SWC）

## React 編譯器

此範本預設未啟用 React Compiler，因為它可能會影響開發與建置效能。如需啟用，請參考官方文件：
[React Compiler 安裝說明](https://react.dev/learn/react-compiler/installation)

## 擴充 ESLint 設定

若您正在開發正式的生產應用，建議使用 TypeScript 並啟用型別相關的 lint 規則。您可以參考官方提供的 [TS 範本](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts)，了解如何在專案中整合 TypeScript 與 [`typescript-eslint`](https://typescript-eslint.io)。
