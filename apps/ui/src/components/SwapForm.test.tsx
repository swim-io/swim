import { fireEvent, render } from "@testing-library/react";
import { renderHook } from "@testing-library/react-hooks";
import userEvent from "@testing-library/user-event";
import Decimal from "decimal.js";
import * as React from "react";
import { useQueryClient } from "react-query";
import { ecosystems } from "../config";
import { AppContext, useConfig } from "../contexts";
import { usePool } from "../hooks";
import SwapPage from "../pages/SwapPage";
import { SwapForm } from "./SwapForm";


it('input boxes are preloaded with the first two tokens', () => {

  const hook  =   renderHook(() => useConfig(), {
    wrapper: AppContext,
  });
  const pools = hook.result.current.pools
  const {container} = render(<SwapPage/>)

  const pool = pools.find((pool) => pool && !pool.isStakingPool);
  if(!pool) fail("Could not find a non-staking pool in the list of pools")
  const { tokens, poolUsdValue, isPoolPaused } = usePool(pool.id);

  const [a, b] = tokens
  const textFields = container.getElementsByClassName("bootleg-super-select")
  expect(textFields.length).toBe(2)

  tokens.forEach((val, index) => {
    const ecosystem = ecosystems[val.nativeEcosystem];
    const elem = textFields.item(index);
    expect(elem).not.toBeNull()
    expect(ecosystem).not.toBeNull()
    expect(elem?.innerHTML).toContain(val.symbol)
    expect(elem?.innerHTML).toContain(ecosystem.displayName)
  })

})

describe("SwapForm tests", () => {
  const { pools } = useConfig();

  const pool = pools.find((pool) => pool && !pool.isStakingPool);
  if (!pool) fail("Could not find a non-staking pool in the list of pools")
  const { container } = render(<SwapForm poolId={pool.id} setCurrentInteraction={jest.fn()} maxSlippageFraction={new Decimal(.5).div(100)} />)
  const { tokens } = usePool(pool.id);
  const [fromToken, toToken] = tokens
  const fromField = container.querySelector("#from-token-select")
  const toField = container.querySelector("#to-token-select")
  const fromEcosystem = ecosystems[fromToken.nativeEcosystem]
  const toEcosystem = ecosystems[toToken.nativeEcosystem]

//Preflight
  if(!fromField)  fail("could not find elem with id #from-token-select")
  if(!fromEcosystem)  fail("could not find ecosystem for fromToken")
  if(!toField)  fail("could not find elem with id #to-token-select")
  if(!toEcosystem)  fail("could not find ecosystem for toToken")


  const openModal = (field: Element, idPrefix: string): Element => {
    fireEvent.click(field)
    const modal = container.querySelector(`#${idPrefix}-token-modal`)
    expect(modal).not.toBeNull()
    expect(modal).toBeVisible()
    return modal || fail("could not retrieve modal")
  }
  const closeModal = (modal: Element): void => {
    const close = modal?.querySelector(".euiModalFooter.euiButton")
    expect(close?.innerHTML).toMatch("close")
    fireEvent.click(close || fail("could not find close button"))
    expect(modal).not.toBeVisible()
  }


  it('input boxes are preloaded with the first two tokens', () => {
    expect(fromField?.innerHTML).toContain(fromToken.symbol)
    expect(fromField?.innerHTML).toContain(fromEcosystem.displayName)
    expect(toField?.innerHTML).toContain(toToken.symbol)
    expect(toField?.innerHTML).toContain(toEcosystem.displayName)
  })

  it('basic open and close modal test', () => {
    const modal = openModal(fromField, "from")
    closeModal(modal)
  })
  it('selecting token closes modal and updates from', () => {
    const modal = openModal(fromField, "from")
    const listItems = modal.querySelectorAll(".token-list-item")
    expect(listItems.length).toBeGreaterThan(0)
    const selectedLabel = listItems[listItems.length-1].innerHTML
    fireEvent.click(listItems[listItems.length-1])
    expect(fromField.innerHTML).toMatch(selectedLabel)
  })
  it('filtering on solana reduces visible elems', () => {
//Get the tokens that we expect to appear post filter
    const expectElems = tokens
      .filter(t => ecosystems[t.nativeEcosystem] !== null && (
        ecosystems[t.nativeEcosystem].displayName.toLowerCase().includes("sol") ||
        t.symbol.toLowerCase().includes("sol")
      ))
//Get the tokens that appear post filter
    const modal = openModal(fromField, "from")
    const filterInput = modal.querySelector(".token-select-modal-filter-input")
    if(!filterInput) fail("could not retrieve token modal filter input field")
    userEvent.type(filterInput, "SOL")
    const resultingElems = modal.querySelectorAll(".token-list-item")

    expect(expectElems.length).toBeGreaterThan(0)
    expect(expectElems.length).not.toBe(tokens.length) //Filter did filter test
    expect(resultingElems.length).toBeGreaterThan(0)
    expect(resultingElems.length).toBe(expectElems.length)
  })
  //it('selecting toToken === fromToken in toToken modal resets fromToken () => {})
  //it('to modal does not list from modal selection', () => {})
})
