# M6 terv és Azure-költségbecslés

Állapot: **jóváhagyásra vár**. Azure-erőforrás nem jött létre; a `terraform apply` előtt külön jóváhagyás kell.

## Lépések

| Feladat | Tartalom | Megjegyzés |
|---|---|---|
| T6.1 | `infra/`: Terraform (azurerm), erőforráscsoport, VNet, NSG (80/443 nyitva, SSH csak a megadott IP-ről, a k3s API zárva), statikus publikus IP DNS-címkével, VM (Ubuntu LTS) cloud-init k3s-sel, backup storage account (Blob, LRS) | lokális state, nincs titok a state-ben (a VM SSH-kulcsa a felhasználó publikus kulcsa) |
| T6.2 | `deploy/`: sima manifestek (namespace, MySQL és Redis StatefulSet PVC-vel, backend, worker, nginx, közös `sites-data` PVC), Argo CD telepítése és `Application` | secret egyszeri `kubectl create secret` |
| T6.3 | Traefik (k3s beépített) ACME: előbb Let's Encrypt staging, majd production az Azure DNS-névre | az `azure.com` közös limitje miatt az első igénylés elbukhat (AI-024); tartalék: DuckDNS |
| T6.4 | CI `publish` után: az image tag commit a `deploy/`-ba → Argo CD sync → smoke teszt; rollback: `git revert` | a `main` védett: a tag-commitot a CI egy külön, szűk jogú tokennel vagy PR-ral írja |

Sorrend: T6.1 → (kézzel: `terraform apply`, k3s ellenőrzés) → T6.2 → T6.3 → T6.4. A T6.2 és T6.4 a VM nélkül is megírható és `kubectl apply --dry-run`-nal ellenőrizhető; a T6.1 kódja is megírható `terraform validate`/`plan` nélkül Azure-hitelesítés híján, de a `plan` és az `apply` bejelentkezést igényel.

## Költségbecslés (régió: West Europe, havi, USD, nyilvános listaárak nagyságrendje)

> Becslés, nem lekérdezett ár: kiadás előtt az Azure Pricing Calculatorral ellenőrizendő.

| Tétel | Méret | Havi költség (24/7) |
|---|---|---|
| VM | 2 vCPU, 4 GB (pl. B2s) | ~30 |
| OS-lemez | 64 GB Standard SSD | ~5 |
| Publikus IP | Standard, statikus | ~4 |
| Storage account | Blob LRS, néhány MB mentés | < 1 |
| Application Insights / Log Analytics | ingyenes keret alatt | ~0 |
| **Összesen** | | **~40** |

- A VM leállításával (deallocate) a számítási költség nullára esik; a lemez és az IP ilyenkor is fizetős (~9/hó). Értékelés előtti 1–2 hét futtatással ~20–25 USD.
- Kockázat: a k3s, Argo CD, Prometheus, Grafana, MySQL és az alkalmazás 4 GB-on szűk; ha kevés, a 8 GB-os VM (~60/hó) a tartalék.
- Az Azure for Students keret (ha elérhető) fedezheti.

## Döntéshez szükséges

1. Jóváhagyod a ~40 USD/hó (vagy leállítva ~9) költséget és a VM-méretet (4 GB, szükség esetén 8 GB)?
2. Az Azure-hitelesítést (`az login`, előfizetés) neked kell elvégezned; az `apply` előtt `terraform plan` kimenetet mutatok.
3. SSH-hozzáférés forrás-IP-je és a DNS-címke neve.
