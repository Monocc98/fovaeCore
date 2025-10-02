import { useDispatch } from "react-redux"
import { onChangeLevelDown, onChangeLevelUp, onChangeTab, onInitFormHome, onResetHome, onRestoreHomeSnapshot } from "@/store/home/homeSlice";
import type { HomeResponse } from "../types/get-home.response";
import { useAppSelector } from "./types/homeHook.type";
import { useQueryClient } from "@tanstack/react-query";
import { getHomeAction } from "../actions/get-home.action";

export interface TabsItem {
    id: string;
    name: string;
    content: any[] | undefined
    balance: number | undefined;
}

export const useHomeStore = () => {

    const dispatch = useDispatch();
    const queryClient = useQueryClient();

    //Refresh del homeResponse
    const refreshHome = async () => {
        // 1) invalidar
        await queryClient.invalidateQueries({ queryKey: ["homeOverlay"] });
        // 2) refetch manual (opcional: podrías usar queryClient.fetchQuery)
        const fresh = await queryClient.fetchQuery({
        queryKey: ["homeOverlay"],
        queryFn: getHomeAction,
        staleTime: 1000 * 60 * 5,
        });
        // 3) re-hidratar el slice
        if (fresh) dispatch(onInitFormHome(fresh));
    };

    const { mode, homeResponse, activeGroupId, activeCompanyId, activeAccountId } = useAppSelector((state) => state.home);

    const groups = homeResponse?.groups ?? [];
    const currentGroup = groups.find( group => group._id === activeGroupId) ?? null;

    const companies = currentGroup?.companies ?? [];
    const currentCompany = companies?.find( company => company._id === activeCompanyId ) ?? null;

    const accounts = currentCompany?.accounts ?? [];
    const currentAccount = accounts?.find( account => account._id === activeAccountId ) ?? null;

    const startHome = ( homeResponse: HomeResponse) => {
        dispatch( onInitFormHome(homeResponse));
    }

    const resetHome = () => {
        dispatch( onResetHome());
        refreshHome();
    }

    const changeTab = ( activeId: string ) => {
        dispatch( onChangeTab({ activeId }) );
    }

    const changeLevelUp = ( activeId: string ) => {
        dispatch( onChangeLevelUp({ activeId }) );
    }

    const changeLevelDown = ( activeId: string ) => {
        dispatch( onChangeLevelDown({ activeId }) );
    }

    // Tabs dinamicos 
    const tabsItems: TabsItem[] = mode === "group"
        ? groups.map( group => ({ id: group._id, name: group.name, content: currentGroup?.companies, balance: currentGroup?.balance }) )
        : ( mode === "company" ) 
            ? companies.map( company => ({ id: company._id, name: company.name, content: currentCompany?.accounts, balance: currentCompany?.balance }) )
            : accounts.map( account => ({ id: account._id, name: account.name, content: [], balance: account.balance }) )

    const restoreHomeSnapshot = (snap: {
        mode: "group" | "company" | "account";
        activeGroupId?: string | null;
        activeCompanyId?: string | null;
        activeAccountId?: string | null;
    }) => {
        dispatch(onRestoreHomeSnapshot(snap));
    };

    return {
        // Props
        mode,
        homeResponse,
        groups,
        currentGroup,
        companies,
        currentCompany,
        accounts,
        currentAccount,
        activeGroupId,
        activeCompanyId,
        activeAccountId,
        tabsItems,
        // Metodos
        startHome,
        resetHome,
        changeTab,
        changeLevelUp,
        changeLevelDown,
        refreshHome,
        restoreHomeSnapshot,
    }

}