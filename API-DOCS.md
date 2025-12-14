```markdown
# Dokumentasi API

Base URL: `http://<IP-SERVER>/api`
Auth: Bearer Token (Header `Authorization`)

## 1. Authentication (`/auth`)
| Method | Endpoint | Deskripsi | Body |
| :--- | :--- | :--- | :--- |
| POST | `/login` | Login user | `{email, password}` |
| POST | `/refresh` | Refresh Access Token | `{refreshToken}` |
| GET | `/me` | Get User Profile | - |

## 2. Orders (`/orders`)
| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| GET | `/` | All | List Order. Query: `page`, `limit`, `status`, `search`. |
| POST | `/` | All | Buat Order. <br> Body: `{items: [{menuId, quantity}], orderType: "DINE_IN", tableNumber: "12"}` |
| GET | `/:id` | All | Detail Order (Struk). |
| PATCH | `/:id/status` | All | Update Status (`PENDING` -> `PAID` -> `READY`). |
| DELETE | `/:id` | Admin | Batalkan Pesanan. |

## 3. Menus (`/menus`)
| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| GET | `/` | All | List Menu. Query: `search`, `category`. |
| POST | `/` | **Admin** | Tambah Menu Baru. |
| PATCH | `/:id` | **Admin** | Update Menu (Harga/Stok). |
| DELETE | `/:id` | **Admin** | Hapus Menu. |

## 4. Categories (`/categories`)
| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| GET | `/` | All | List Kategori. |
| POST | `/` | **Admin** | Tambah Kategori. |
| DELETE | `/:id` | **Admin** | Hapus Kategori (Jika kosong). |

## 5. User Management (`/users`)
| Method | Endpoint | Role | Deskripsi |
| :--- | :--- | :--- | :--- |
| GET | `/` | **Admin** | List Semua Karyawan. |
| POST | `/` | **Admin** | Registrasi Staff Baru. Body: `{name, email, password, role}` |
| PATCH | `/:id` | **Admin / Self** | Update Data Karyawan atau Profil Sendiri. Body: `{name, email, password, role}` |
| DELETE | `/:id` | **Admin** | Hapus Akses Karyawan. |

## 6. System
| Method | Endpoint | Deskripsi |
| :--- | :--- | :--- |
| GET | `/api/health` | Cek status server (Uptime/OK). |