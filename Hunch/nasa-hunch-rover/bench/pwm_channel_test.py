#!/usr/bin/env python3
"""
Bench-test Cytron MDD10A (or compatible) PWM/DIR channels from Raspberry Pi GPIO.

Run on the Pi with wheels OFF THE GROUND. Requires: pip install gpiozero
Edit PIN_MAP below to match your wiring before first power-on.
"""
from __future__ import annotations

import argparse
import time

try:
    from gpiozero import DigitalOutputDevice, PWMOutputDevice
except ImportError as exc:
    raise SystemExit("Install gpiozero on the Pi: pip install gpiozero") from exc

# BCM numbering — Cytron MDD10A: PWM = speed, DIR = direction (HIGH = forward)
PIN_MAP = {
    "left": {"pwm": 12, "dir": 16},
    "right": {"pwm": 13, "dir": 20},
}


def ramp_channel(label: str, pwm_pin: int, dir_pin: int, hold_s: float) -> None:
    pwm = PWMOutputDevice(pwm_pin, frequency=20000)
    direction = DigitalOutputDevice(dir_pin)
    print(f"[{label}] forward ramp 0 → 0.5 → 0")
    direction.on()
    for duty in [0.0, 0.15, 0.3, 0.5, 0.3, 0.15, 0.0]:
        pwm.value = duty
        print(f"  PWM {duty:.2f}")
        time.sleep(hold_s)
    print(f"[{label}] reverse pulse 0.25")
    direction.off()
    pwm.value = 0.25
    time.sleep(hold_s * 2)
    pwm.value = 0.0
    pwm.close()
    direction.close()
    print(f"[{label}] OK")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--hold", type=float, default=0.8, help="seconds per PWM step")
    parser.add_argument("--channel", choices=["left", "right", "both"], default="both")
    args = parser.parse_args()
    print("WARNING: wheels must be elevated. LiFePO4 connected — fuse recommended.")
    time.sleep(2)
    channels = ["left", "right"] if args.channel == "both" else [args.channel]
    for name in channels:
        pins = PIN_MAP[name]
        ramp_channel(name, pins["pwm"], pins["dir"], args.hold)
    print("All requested channels exercised.")


if __name__ == "__main__":
    main()
