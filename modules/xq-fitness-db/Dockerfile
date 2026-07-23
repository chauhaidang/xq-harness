# Curated-import placeholder. Issue #47 replaces this with the verified Prisma
# baseline image. Legacy standalone SQL under docs/legacy-history is
# intentionally not copied into PostgreSQL initialization.
FROM postgres:16-alpine

ENV POSTGRES_DB=xq_fitness
ENV POSTGRES_USER=xq_user
ENV POSTGRES_PASSWORD=xq_password

EXPOSE 5432

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB} || exit 1
