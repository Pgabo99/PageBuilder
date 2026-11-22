# M6 terv és Azure-költségbecslés

> **Hatókörváltozás (2026-11-21):** a rendszert nem telepítjük Azure-ba; az `infra/` és a `deploy/` megmarad, az `apply` elmarad. A T6.3 (Traefik HTTPS) kikerült, a T6.4/1 (tag-bump PR) kész, a T6.4/2a (kind + Argo CD első szinkron) helyben és CI-ban igazolt, a T6.4/2b nem készül el: [roadmap](roadmap.md). Az alábbi terv és költségbecslés tájékoztató.

Állapot: a sorrendet és a 4 GB-os kiindulást a felhasználó elfogadta; a T6.1 konfiguráció elkészült (`infra/`). Azure-erőforrás **nem** jött létre; a `terraform apply` előtt külön jóváhagyás kell a `plan` és a költség ismeretében.

## Lépések

| Feladat | Tartalom | Megjegyzés |
|---|---|---|
| T6.1 | `infra/`: Terraform (azurerm), erőforráscsoport, VNet, NSG (80/443 nyitva, SSH csak a megadott IP-ről, a k3s API zárva), statikus publikus IP DNS-címkével, VM (Ubuntu LTS) cloud-init k3s-sel, backup storage account (Blob, LRS) | lokális state, nincs titok a state-ben (a VM SSH-kulcsa a felhasználó publikus kulcsa) |
| T6.2 | `deploy/`: sima manifestek (namespace, MySQL és Redis StatefulSet PVC-vel, backend, worker, nginx, közös `sites-data` PVC), Argo CD telepítése és `Application` | secret egyszeri `kubectl create secret` |
| T6.3 | Traefik (k3s beépített) ACME: előbb Let's Encrypt staging, majd production az Azure DNS-névre | az `azure.com` közös limitje miatt az első igénylés elbukhat (AI-024); tartalék: DuckDNS |
| T6.4 | CI `publish` után: az image tag commit a `deploy/`-ba → Argo CD sync → smoke teszt; rollback: `git revert` | a `main` védett: a tag-commitot a CI egy külön, szűk jogú tokennel vagy PR-ral írja |

Sorrend: T6.1 → (kézzel: `terraform apply`, k3s ellenőrzés) → T6.2 → T6.3 → T6.4. A T6.2 és T6.4 a VM nélkül is megírható és `kubectl apply --dry-run`-nal ellenőrizhető; a T6.1 kódja is megírható `terraform validate`/`plan` nélkül Azure-hitelesítés híján, de a `plan` és az `apply` bejelentkezést igényel.

## Költségbecslés (West Europe, USD, Azure Retail Prices API, 2026-11-21, 730 óra/hó)

| Tétel | Egységár | Havi |
|---|---|---|
| VM Standard_B2s (2 vCPU, 4 GB), Linux | 0,048 USD/óra | 35,04 |
| OS-lemez 64 GB Standard SSD (E6 LRS) | 4,80 USD/hó | 4,80 |
| Standard statikus publikus IPv4 | 0,005 USD/óra | 3,65 |
| Backup Blob (Hot LRS) | 0,0196 USD/GB/hó | < 0,10 (néhány GB-ig) |
| Kimenő forgalom | az első 100 GB/hó ingyenes | 0 |
| **24/7 összesen** | | **~43,6** |
| **Leállítva (deallocate)** | lemez + IP + tároló | **~8,6** |

- Tranzakciós és lemez-műveleti díjak (tized cent nagyságrend) nincsenek benne. A költség tájékoztató: a tényleges számlát az előfizetés ajánlata és a használat dönti el.
- Alternatívák (azonos régió): `Standard_B2als_v2` (4 GB) 0,0432 USD/óra, ~31,5/hó; `Standard_B2ms` (8 GB) 0,096 USD/óra, ~70,1/hó.
- Nincs benne Application Insights/Log Analytics (az MVP-ben nem hozunk létre), Key Vault, Load Balancer, NAT Gateway, Bastion és DNS-zóna.
- Költségtakarékosság: `auto_shutdown_time` napi leállításhoz; nem használt időszakban deallocate; `terraform destroy` a beadás után.

## Memóriaigény 4 GB-on (becslés tipikus értékekből, éles méréssel még nem ellenőrizve)

| Komponens | Várható RAM |
|---|---|
| Ubuntu + k3s szerver (containerd, kubelet) | 0,6–0,8 GB |
| Traefik, CoreDNS, metrics-server, local-path | 0,15 GB |
| Argo CD (dex, notifications, applicationset kikapcsolva) | 0,4–0,5 GB |
| Prometheus (rövid megőrzés) + kube-state-metrics + node-exporter | 0,4–0,6 GB |
| Grafana | 0,15–0,25 GB |
| MySQL 9 (kis buffer pool) | 0,4–0,6 GB |
| Redis, backend (PHP-FPM), worker, nginx | 0,3–0,4 GB |
| **Összesen** | **~2,5–3,4 GB a ~3,8 GB használhatóból** |

Szűk, de belefér; a többletet a Prometheus megőrzése és a MySQL buffer poolja adja. Teendők: minden podra memory request/limit, a Prometheus megőrzése 2–3 nap, `innodb_buffer_pool_size` ~128 MB, az Argo CD felesleges komponenseinek kikapcsolása. A telepítés után `kubectl top` méri a valós használatot; ha tartósan >85%, a `vm_size` egy változóval `Standard_B2ms`-re (8 GB) emelhető, az adatok megmaradnak (átméretezés újraindítással).

## Az `apply` előtt szükséges

1. Külön jóváhagyás a `terraform plan` kimenet és a fenti költség ismeretében.
2. Azure-bejelentkezés (`az login`) és előfizetés: a felhasználó végzi.
3. `terraform.tfvars`: `dns_label`, `ssh_allowed_cidr` (nem `0.0.0.0/0`), `ssh_public_key`; opcionálisan `vm_size`, `auto_shutdown_time`.
