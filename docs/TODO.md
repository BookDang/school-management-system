# TODO

Things left open from today, to pick up tomorrow.

- [ ] Tạo `.env` thật ở root (copy từ `.env.example`) để `docker compose`/`./docker.sh up` chạy được.
- [ ] Cài `@hookform/resolvers` khi bắt đầu làm form đầu tiên (nối `zod` với `react-hook-form`,
      xem `docs/CONVENTIONS.md`).
- [ ] Chọn ORM/ODM cho `api` (TypeORM hay Prisma?) và kết nối tới MySQL — hiện chưa có gì ngoài
      Docker Compose service `db`.
- [ ] Bắt đầu feature thật đầu tiên (students/teachers/classes?) theo cấu trúc
      `api/src/modules/<feature>/` và `web/src/features/<feature>/` đã thiết lập.
- [ ] Tạo CI trên GitHub (GitHub Actions workflow chạy `npm run check` — lint + unit test + build
      cho cả `api` và `web` — khi push/mở PR).
- [ ] Bật branch protection cho `develop` và `main` trên GitHub (Settings → Branches → Add rule):
      chặn push trực tiếp, bắt buộc merge qua PR, và bắt buộc CI pass trước khi merge.
