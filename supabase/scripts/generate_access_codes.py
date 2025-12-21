import argparse
import secrets
import string


def gen_code(prefix: str, length: int) -> str:
    alphabet = string.ascii_uppercase + string.digits
    return f"{prefix}{''.join(secrets.choice(alphabet) for _ in range(length))}"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--count", type=int, default=50)
    ap.add_argument("--prefix", type=str, default="MB-")
    ap.add_argument("--length", type=int, default=10)
    args = ap.parse_args()

    print("-- Generated access codes (insert into public.access_codes)")
    print("insert into public.access_codes (code, is_active) values")
    rows = []
    for _ in range(args.count):
        rows.append(f"  ('{gen_code(args.prefix, args.length)}', true)")
    print(",\n".join(rows) + "\n;")


if __name__ == "__main__":
    main()


