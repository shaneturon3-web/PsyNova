# PsyNova booking flow restore v2

This patch is reversible and does not depend on the missing `viewAppointments` marker.

Apply:

```bash
unzip psynova-booking-flow-restore-v2.zip
bash psynova-booking-flow-restore-v2/scripts/apply-booking-flow-restore-v2.sh
```

Revert:

```bash
bash psynova-booking-flow-restore-v2/scripts/revert-booking-flow-restore-v2.sh
```
