# syntax=docker/dockerfile:1

# prometheus-nginxlog-exporter v1.11.0 (a projekt hivatalos forrása, tag-commit 9e43c6be) friss Go-val fordítva: a hivatalos
# image 2023-as, Go 1.18-cal épült, és a Go standard könyvtárában 45 HIGH/CRITICAL sebezhetőség van. A forrást nem módosítjuk;
# a modul a Go modulproxyról jön, a go.sum-ellenőrzéssel (sumdb).
FROM golang:1.27.4-alpine3.24@sha256:70bd7ddea8b6cbe5d6943cde279d6b67feb10cc924fb9100d1d8757c1575b280 AS build
ENV CGO_ENABLED=0
RUN go install -trimpath -ldflags="-s -w" github.com/martin-helmich/prometheus-nginxlog-exporter@v1.11.0

FROM scratch
COPY --from=build /go/bin/prometheus-nginxlog-exporter /prometheus-nginxlog-exporter
USER 65534:65534
EXPOSE 4040
ENTRYPOINT ["/prometheus-nginxlog-exporter"]
