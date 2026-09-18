import argparse
import sys
import time

import requests
from realistic_scenarios import ScenarioGenerator

DEFAULT_API_URL = "http://127.0.0.1:5000/api/sensor-data"
DEFAULT_DEMO_URL = "http://127.0.0.1:5000/api/demo/scenario"


def run_simulator(mode='auto', interval=4.0, api_url=DEFAULT_API_URL, demo_url=DEFAULT_DEMO_URL):
    generator = ScenarioGenerator()
    print("===============================================================")
    print("  Terra Shield IoT Sensor Simulator")
    print(f"  Target Backend API: {api_url}")
    print(f"  Initial Mode: {mode.upper()}")
    print(f"  Interval: {interval} seconds")
    print("===============================================================\n")

    active_mode = mode.lower()

    while True:
        try:
            try:
                resp = requests.get(demo_url, timeout=1.5)
                if resp.status_code == 200:
                    remote_scenario = resp.json().get('current_scenario', '').lower()
                    if remote_scenario and remote_scenario in ['normal', 'warning', 'critical', 'fault', 'auto']:
                        if remote_scenario != active_mode:
                            print(f"\n[DEMO SYNC] Scenario updated remotely to: {remote_scenario.upper()}")
                            active_mode = remote_scenario
            except Exception:
                pass

            if active_mode == 'normal':
                payload = generator.generate_normal()
            elif active_mode == 'warning':
                payload = generator.generate_warning()
            elif active_mode == 'critical':
                payload = generator.generate_critical()
            elif active_mode == 'fault':
                payload = generator.generate_fault()
            else:
                payload = generator.generate_auto()

            print(f"[{time.strftime('%H:%M:%S')}] Sending Payload ({active_mode.upper()}):")
            print(f"  -> Device: {payload['device_id']} | Site: {payload['site_id']}")
            print(
                f"  -> Rain: {payload['rainfall']}mm | Slope: {payload['slope']} deg | "
                f"Soil Moisture: {payload['soil_moisture']}% | Displacement: {payload['ground_movement']}mm"
            )

            response = requests.post(api_url, json=payload, timeout=3.0)
            if response.status_code in [200, 201]:
                res_data = response.json()
                risk = res_data.get('risk_level', 'N/A')
                probability = res_data.get('risk_probability', 0.0)
                print(f"  <- Response [{response.status_code}]: SUCCESS | Risk: {risk} | Probability: {probability * 100:.1f}%\n")
            else:
                print(f"  <- Response [{response.status_code}]: REJECTED | {response.text}\n")

        except requests.exceptions.ConnectionError:
            print(f"[{time.strftime('%H:%M:%S')}] Connection Error: Could not connect to backend API at {api_url}. Retrying in {interval}s...\n")
        except Exception as exc:
            print(f"[{time.strftime('%H:%M:%S')}] Simulator Error: {str(exc)}\n")

        time.sleep(interval)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description="Terra Shield IoT landslide sensor data simulator")
    parser.add_argument(
        '--mode',
        choices=['normal', 'warning', 'critical', 'auto', 'fault'],
        default='auto',
        help="Simulation mode (normal, warning, critical, auto, fault)"
    )
    parser.add_argument('--interval', type=float, default=4.0, help="Transmission interval in seconds")
    parser.add_argument('--url', type=str, default=DEFAULT_API_URL, help="Backend sensor-data API URL")

    args = parser.parse_args()
    run_simulator(mode=args.mode, interval=args.interval, api_url=args.url)
