#!/usr/bin/env python3
"""Verifica a paridade do motor de score do CredFlow.

Implementa a especificação normativa da §7 de docs/PRD-backend.md e a compara
com uma implementação real:

  --api-url   compara com a API rodando (POST /api/v1/simulations)
  (sem flag)  apenas valida os 7 casos-limite contra a especificação

Sem dependências externas — só a biblioteca padrão.

Uso:
    python3 check_parity.py
    python3 check_parity.py --api-url http://localhost:8080
    python3 check_parity.py --api-url http://localhost:8080 --grid
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.error
import urllib.request
from dataclasses import dataclass

# --- Especificação normativa (§7 do PRD) ------------------------------------
# Atenção: as comparações são ESTRITAS (>). Trocar por >= muda o resultado de
# usuários na fronteira e é o erro mais comum ao portar estas regras.


def commitment_ratio(income: float, debts: float) -> float:
    if income <= 0:
        raise ValueError("income deve ser >= 1")
    return debts / income


def score_of(income: float, debts: float, income_type: str) -> int:
    ratio = commitment_ratio(income, debts)
    total = 500

    if ratio > 0.60:
        total -= 300
    elif ratio > 0.30:
        total -= 150
    else:
        total += 100

    if income > 5000:
        total += 150
    elif income > 3000:
        total += 80

    total += 100 if income_type == "CLT" else -50

    return max(0, min(1000, total))


def classification_of(score: int) -> str:
    if score >= 800:
        return "EXCELLENT"
    if score >= 600:
        return "GOOD"
    if score >= 400:
        return "FAIR"
    return "POOR"


def decision_of(income: float, debts: float) -> str:
    ratio = commitment_ratio(income, debts)
    if income > 3000 and ratio < 0.30:
        return "APPROVED"
    if ratio > 0.60:
        return "DENIED"
    return "UNDER_REVIEW"


def explanations_of(income: float, debts: float) -> list[str]:
    ratio = commitment_ratio(income, debts)
    out = []
    if ratio > 0.60:
        out.append("Seu nível de endividamento está muito alto.")
    if ratio < 0.30:
        out.append("Seu controle de dívidas é positivo.")
    if income < 2000:
        out.append("Sua renda pode limitar seu acesso ao crédito.")
    return out


def suggestions_of(score: int) -> list[str]:
    if score < 400:
        return [
            "Reduza suas dívidas antes de solicitar crédito",
            "Evite atrasos em pagamentos",
        ]
    if score < 700:
        return [
            "Tente reduzir seu comprometimento mensal",
            "Mantenha pagamentos em dia",
        ]
    return ["Continue mantendo seu bom histórico financeiro"]


# --- Casos-limite obrigatórios (§7.6) ---------------------------------------


@dataclass(frozen=True)
class Case:
    n: int
    income: float
    debts: float
    income_type: str
    score: int
    classification: str
    decision: str


CASES = [
    Case(1, 6000, 1000, "CLT", 850, "EXCELLENT", "APPROVED"),
    Case(2, 3000, 900, "CLT", 700, "GOOD", "UNDER_REVIEW"),
    Case(3, 2000, 1400, "AUTONOMO", 150, "POOR", "DENIED"),
    Case(4, 10000, 100, "PJ", 700, "GOOD", "APPROVED"),
    Case(5, 1000, 900, "AUTONOMO", 150, "POOR", "DENIED"),
    Case(6, 5000, 2000, "CLT", 530, "FAIR", "UNDER_REVIEW"),
    Case(7, 1, 0, "CLT", 700, "GOOD", "UNDER_REVIEW"),
]

GREEN, RED, YELLOW, RESET = "\033[32m", "\033[31m", "\033[33m", "\033[0m"


def check_spec() -> int:
    """A especificação do script bate com a tabela do PRD?"""
    failures = 0
    print("Casos-limite da §7.6 (especificação do script vs tabela do PRD)\n")
    for c in CASES:
        got_score = score_of(c.income, c.debts, c.income_type)
        got_class = classification_of(got_score)
        got_dec = decision_of(c.income, c.debts)
        ok = (got_score, got_class, got_dec) == (c.score, c.classification, c.decision)
        mark = f"{GREEN}PASS{RESET}" if ok else f"{RED}FAIL{RESET}"
        print(
            f"  [{mark}] caso {c.n}: income={c.income:>7} debts={c.debts:>6} "
            f"{c.income_type:<9} score={got_score:>4} {got_class:<9} {got_dec}"
        )
        if not ok:
            failures += 1
            print(
                f"         esperado: score={c.score} {c.classification} {c.decision}"
            )
    return failures


def call_api(base: str, case_input: dict) -> dict:
    req = urllib.request.Request(
        f"{base.rstrip('/')}/api/v1/simulations",
        data=json.dumps(case_input).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read())


def check_api(base: str, inputs: list[tuple[float, float, str]]) -> int:
    failures = 0
    print(f"\nComparando com a API em {base}\n")
    for income, debts, income_type in inputs:
        payload = {
            "name": "Teste Paridade",
            "age": 30,
            "income": income,
            "debts": debts,
            "incomeType": income_type,
        }
        try:
            body = call_api(base, payload)
        except urllib.error.URLError as exc:
            print(f"  {RED}ERRO{RESET} ao chamar a API: {exc}")
            return 1

        want_score = score_of(income, debts, income_type)
        want_class = classification_of(want_score)
        want_dec = decision_of(income, debts)

        got_score = body.get("score")
        got_class = (body.get("classification") or {}).get("code")
        got_dec = (body.get("decision") or {}).get("code")

        ok = (got_score, got_class, got_dec) == (want_score, want_class, want_dec)
        if ok:
            print(
                f"  [{GREEN}PASS{RESET}] income={income:>7} debts={debts:>6} "
                f"{income_type:<9} score={got_score}"
            )
        else:
            failures += 1
            print(
                f"  [{RED}FAIL{RESET}] income={income:>7} debts={debts:>6} {income_type}\n"
                f"         esperado: score={want_score} {want_class} {want_dec}\n"
                f"         obtido:   score={got_score} {got_class} {got_dec}"
            )
    return failures


def grid() -> list[tuple[float, float, str]]:
    """Varredura em torno das fronteiras, onde os erros de > vs >= aparecem."""
    incomes = [1, 1999, 2000, 2999, 3000, 3001, 4999, 5000, 5001, 12000]
    ratios = [0.0, 0.2999, 0.30, 0.3001, 0.5999, 0.60, 0.6001, 0.95]
    types = ["CLT", "AUTONOMO", "PJ"]
    return [
        (inc, round(inc * r, 2), t) for inc in incomes for r in ratios for t in types
    ]


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--api-url", help="Base da API, ex.: http://localhost:8080")
    ap.add_argument(
        "--grid",
        action="store_true",
        help="Varre valores em torno das fronteiras (exige --api-url)",
    )
    args = ap.parse_args()

    failures = check_spec()

    if args.api_url:
        inputs = (
            grid()
            if args.grid
            else [(c.income, c.debts, c.income_type) for c in CASES]
        )
        failures += check_api(args.api_url, inputs)
    elif args.grid:
        print(f"\n{YELLOW}--grid exige --api-url; ignorando.{RESET}")

    print()
    if failures:
        print(f"{RED}{failures} divergência(s).{RESET} Veja §7 de docs/PRD-backend.md.")
        return 1
    print(f"{GREEN}Paridade OK.{RESET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
