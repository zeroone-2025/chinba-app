import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import MainLayout from "@/components/layouts/MainLayout";
import Mannaja from "@/pages/mannaja/Mannaja";
import Jababa from "@/pages/jababa/Jababa";
import Mohat from "@/pages/mohat/Mohat";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <MainLayout>
              <Mannaja />
            </MainLayout>
          }
        />
        <Route
          path="/jababa"
          element={
            <MainLayout>
              <Jababa />
            </MainLayout>
          }
        />
        <Route
          path="/mohat"
          element={
            <MainLayout>
              <Mohat />
            </MainLayout>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
