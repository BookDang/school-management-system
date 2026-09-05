# TODO

Things left open, to pick up next.

- [x] Tạo `.env` thật ở root (copy từ `.env.example`) để `docker compose`/`./docker.sh up` chạy được.
- [x] Chọn ORM cho `api`: **TypeORM** + `mysql2`, kết nối MySQL qua `docker-compose` service `db`.
- [x] Bắt đầu feature thật đầu tiên: **Auth/Users** (`api/src/modules/auth`,
      `api/src/modules/users`) — register/login JWT, `GET /users/me` protected. Unit + e2e test đã
      viết, coverage đạt 70%.
- [x] Tạo CI trên GitHub (`.github/workflows/ci.yml`) — 2 job riêng (`api` có service MySQL cho
      e2e, `web` cài Playwright) chạy lint + test + build khi push/PR vào `main`/`develop`.
- [ ] Cài `@hookform/resolvers` khi bắt đầu làm form đầu tiên bên `web` (nối `zod` với
      `react-hook-form`, xem `docs/CONVENTIONS.md`).
- [ ] Bật branch protection cho `develop` và `main` trên GitHub (Settings → Branches → Add rule):
      chặn push trực tiếp, bắt buộc merge qua PR, và bắt buộc CI pass trước khi merge. (Cần
      `gh auth login` hoặc làm thủ công trên GitHub — chưa làm được vì `gh` chưa đăng nhập.)
- [ ] Mở PR cho 3 nhánh đang chờ, merge theo thứ tự này để tránh conflict `.github/workflows/ci.yml`
      (nhánh `feature/auth-users` có bản CI đầy đủ hơn — merge nó sau cùng, hoặc merge trước rồi bỏ
      nhánh `feature/github-actions-ci`):
      1. `feature/docker-setup` (nếu chưa merge)
      2. `feature/install-apps` (nếu chưa merge)
      3. `feature/github-actions-ci`
      4. `feature/auth-users`
